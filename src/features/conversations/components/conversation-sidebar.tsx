import { CopyIcon, HistoryIcon, LoaderIcon, PlusIcon } from "lucide-react";
import ky from "ky";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversations";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { PastConversationsDialog } from "./past-conversations-dialog";
import { ThinkingDots } from "./thinking-dots";

interface ConversationSidebarProps {
  projectId: Id<"projects">;
}

export const ConversationSidebar = ({
  projectId,
}: ConversationSidebarProps) => {
  const [input, setInput] = useState("");
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [pastConversationsOpen, setPastConversationsOpen] = useState(false);

  const createConversation = useCreateConversation();
  const conversations = useConversations(projectId);

  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);

  const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing",
  );

  const thinkingMessages = [
    "Reading project context...",
    "Inspecting code...",
    "Planning changes...",
    "Generating response...",
    "Finalizing...",
  ];

  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail?.text) return;

      const formatted = `Explain this code:\n${e.detail.text}`;
      setInput(formatted);
    };

    window.addEventListener("curate:add-to-chat", handler);

    return () => {
      window.removeEventListener("curate:add-to-chat", handler);
    };
  }, []);

  const handleCancel = async () => {
    try {
      await ky.post("/api/messages/cancel", {
        json: { projectId },
      });
    } catch {
      toast.error("Unable to cancel request");
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        projectId,
        title: DEFAULT_CONVERSATION_TITLE,
      });

      setSelectedConversationId(newConversationId);

      return newConversationId;
    } catch {
      toast.error("Unable to create a new conversation");
      return null;
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    // If processing and no new message, this is just a stop function
    if (isProcessing && !message.text) {
      await handleCancel();
      setInput("");
      return;
    }

    let conversationId = activeConversationId;

    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) return;
    }

    try {
      await ky.post("/api/messages", {
        json: {
          conversationId,
          message: message.text,
        },
      });
    } catch {
      toast.error("Message failed to send");
    }

    setInput("");
  };

  return (
    <>
      <PastConversationsDialog
        projectId={projectId}
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        onSelect={setSelectedConversationId}
      />

      <div className="flex h-full flex-col border-r border-border/70 bg-sidebar/80 backdrop-blur-xl">
        <div className="flex h-9 items-center justify-between border-b bg-sidebar/70 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2 pl-3">
            <div
              className={cn(
                "size-2 shrink-0 rounded-full",
                isProcessing ? "animate-pulse bg-green-500/80 " : "bg-cyan-400",
              )}
            />

            <div className="truncate text-sm">
              {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
            </div>
          </div>

          <div className="mr-1 flex items-center rounded-lg space-x-2 bg-background/40 p-0.5">
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={() => setPastConversationsOpen(true)}
            >
              <HistoryIcon size="4" />
            </Button>

            <Button
              size="icon-xs"
              variant="highlight"
              onClick={handleCreateConversation}
            >
              <PlusIcon size="4" />
            </Button>
          </div>
        </div>

        <Conversation className="flex-1">
          <ConversationContent className="space-y-5">
            {conversationMessages?.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-2 text-sm font-medium">
                  Ask Curate about your project
                </div>

                <div className="max-w-xs text-xs text-muted-foreground">
                  Explain code, generate components, refactor files, fix bugs,
                  or answer questions about your workspace.
                </div>
              </div>
            )}

            {conversationMessages?.map((message, messageIndex) => (
              <Message key={message._id} from={message.role}>
                <MessageContent>
                  {message.status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ThinkingDots />

                      <motion.span
                        key={thinkingIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        {thinkingMessages[thinkingIndex]}
                      </motion.span>
                    </div>
                  ) : message.status === "cancelled" ? (
                    <span className="italic text-muted-foreground">
                      Request cancelled
                    </span>
                  ) : (
                    <MessageResponse>{message.content}</MessageResponse>
                  )}
                </MessageContent>

                {message.role === "assistant" &&
                  message.status === "completed" &&
                  messageIndex === (conversationMessages?.length ?? 0) - 1 && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast.success("Copied");
                        }}
                        label="Copy"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
              </Message>
            ))}
          </ConversationContent>

          <ConversationScrollButton />
        </Conversation>

        <div className="p-3">
          <PromptInput onSubmit={handleSubmit} className="mt-2">
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask Curate anything..."
                onChange={(e) => setInput(e.target.value)}
                value={input}
                disabled={isProcessing}
              />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools />

              <PromptInputSubmit
                disabled={isProcessing ? false : !input}
                status={isProcessing ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
