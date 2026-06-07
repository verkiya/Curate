import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api, internal } from "../../../../convex/_generated/api";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { createAgent, anthropic, createNetwork } from "@inngest/agent-kit";
import { createReadFilesTool } from "@/inngest/tools/read-file";
import { createListFilesTool } from "@/inngest/tools/list-files";
import { createUpdateFileTool } from "@/inngest/tools/update-file";
import { createCreateFilesTool } from "@/inngest/tools/create-files";
import { createRenameFileTool } from "@/inngest/tools/rename-file";
import { createDeleteFilesTool } from "@/inngest/tools/delete-files";
import { createScrapeUrlsTool } from "@/inngest/tools/scrape-urls";
import { createCreateFolderTool } from "@/inngest/tools/create-folder";
import { CLAUDE_MODELS } from "@/lib/ai-models";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId", // Event refers to the incoming message event and async refers to the original message event that triggered the function
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.CURATE_CONVEX_INTERNAL_KEY;
      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "Sorry, I encountered an error while processing your request. Let me know if you need anything else.",
          });
        });
      }
    },
  },
  { event: "message/sent" },
  async ({ event, step }) => {
    const { messageId, conversationId, projectId, message } =
      event.data as MessageEvent;
    const internalKey = process.env.CURATE_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError(
        "CURATE_CONVEX_INTERNAL_KEY is not configured",
      );
    }

    await step.sleep("wait-for-db-sync", "1s");

    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found!");
    }

    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 5, // Could put it at 10, reducing it to 5 to save context cost
      });
    });
    // Build system prompt with conversation history ( exclude the current processing message )
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;
    // Filter out the current processing messages and empty messages
    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== "",
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");
      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses`;
    }
    // ASSISTANT - How can I help you?
    // USER - Do this and this

    if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: anthropic({
          model: CLAUDE_MODELS.haiku,
          defaultParameters: { temperature: 0, max_tokens: 50 },
        }),
      });

      const { output } = await titleAgent.run(message, { step });
      const textMessage = output.find(
        (m) => m.type === "text" && m.role === "assistant",
      );

      if (textMessage?.type === "text") {
        const title =
          typeof textMessage.content === "string"
            ? textMessage.content.trim()
            : textMessage.content
                .map((c) => c.text)
                .join("")
                .trim();

        if (title) {
          await step.run("update-conversation-title", async () => {
            await convex.mutation(api.system.updateConversationTitle, {
              internalKey,
              conversationId,
              title,
            });
          });
        }
      }
    }
    // Create the coding agent with file tools
    const codingAgent = createAgent({
      name: "curate",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: anthropic({
        model: CLAUDE_MODELS.sonnet, //Opus, if you need reasoning
        defaultParameters: { temperature: 0.2, max_tokens: 8000 }, // Can change tokens to 16000, if needed
      }),
      tools: [
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey }),
        createUpdateFileTool({ internalKey }),
        createCreateFilesTool({ projectId, internalKey }),
        createCreateFolderTool({ projectId, internalKey }),
        createRenameFileTool({ internalKey }),
        createDeleteFilesTool({ internalKey }),
        createScrapeUrlsTool(),
      ],
    });
    // Create network with single agent
    const network = createNetwork({
      name: "curate-network",
      agents: [codingAgent],
      maxIter: 5, // Can tweak the iterations depending on the budget
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (m) => m.type === "text" && m.role === "assistant",
        );
        const hasToolCalls = lastResult?.output.some(
          (m) => m.type === "tool_call",
        );
        // Anthropic outputs text and tool calls together
        // Only stop if there's text without tool calls (final response)
        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }
        return codingAgent;
      },
    });
    //Running the agent
    const result = await network.run(message);
    // Extract the assistant's text response from the last agent result
    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(
      (m) => m.type === "text" && m.role === "assistant",
    );
    let assistantResponse =
      "I processed your request. Let me know if you need anything else!";
    if (textMessage?.type === "text") {
      assistantResponse =
        typeof textMessage.content === "string"
          ? textMessage.content
          : textMessage.content.map((c) => c.text).join("");
    }
    // Update the assistant message with the response ( also sets the status to completed)
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      });
    });
    return { success: true, messageId, conversationId };
  },
);
