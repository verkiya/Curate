// Use this for Claude
// import { generateText, Output } from "ai";
// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { anthropic } from "@ai-sdk/anthropic";
// import { auth } from "@clerk/nextjs/server";

// const suggestionSchema = z.object({
//   suggestion: z
//     .string()
//     .describe(
//       "The code to insert at cursor, or empty string if no completion needed",
//     ),
// });

// const SUGGESTION_PROMPT = `You are a code suggestion assistant.

// <context>
// <file_name>{fileName}</file_name>
// <previous_lines>
// {previousLines}
// </previous_lines>
// <current_line number="{lineNumber}">{currentLine}</current_line>
// <before_cursor>{textBeforeCursor}</before_cursor>
// <after_cursor>{textAfterCursor}</after_cursor>
// <next_lines>
// {nextLines}
// </next_lines>
// <full_code>
// {code}
// </full_code>
// </context>

// <instructions>
// Follow these steps IN ORDER:

// 1. First, look at next_lines. If next_lines contains ANY code, check if it continues from where the cursor is. If it does, return empty string immediately - the code is already written.

// 2. Check if before_cursor ends with a complete statement (;, }, )). If yes, return empty string.

// 3. Only if steps 1 and 2 don't apply: suggest what should be typed at the cursor position, using context from full_code.

// Your suggestion is inserted immediately after the cursor, so never suggest code that's already in the file.
// </instructions>`;

// export async function POST(request: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const {
//       fileName,
//       code,
//       currentLine,
//       previousLines,
//       textBeforeCursor,
//       textAfterCursor,
//       nextLines,
//       lineNumber,
//     } = await request.json();

//     if (!code) {
//       return NextResponse.json({ error: "Code is required" }, { status: 400 });
//     }

//     const prompt = SUGGESTION_PROMPT.replace("{fileName}", fileName)
//       .replace("{code}", code)
//       .replace("{currentLine}", currentLine)
//       .replace("{previousLines}", previousLines || "")
//       .replace("{textBeforeCursor}", textBeforeCursor)
//       .replace("{textAfterCursor}", textAfterCursor)
//       .replace("{nextLines}", nextLines || "")
//       .replace("{lineNumber}", lineNumber.toString());

//     const { output } = await generateText({
//       model: anthropic("claude-haiku-4-5-20251001"), //claude-haiku-4-5-20251001
//       output: Output.object({ schema: suggestionSchema }),
//       prompt,
//       maxRetries: 0,
//       maxOutputTokens: 128,
//       temperature: 0,
//     });

//     return NextResponse.json({ suggestion: output.suggestion });
//   } catch (error) {
//     console.error("Suggestion error: ", error);
//     return NextResponse.json(
//       { error: "Failed to generate suggestion" },
//       { status: 500 },
//     );
//   }
// }
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { MODELS } from "@/lib/ai-model";

const suggestionSchema = z.object({
  suggestion: z
    .string()
    .describe(
      "The exact code to insert at the cursor, or empty string if no completion is needed",
    ),
});

const SUGGESTION_PROMPT = `You are an inline code completion engine.

Return ONLY the exact code that should be inserted at the cursor.

STRICT RULES:
- Return code only
- No markdown
- No explanations
- No comments unless required by the code
- Never repeat code already after the cursor
- Continue naturally from the cursor position
- If no completion is appropriate, return an empty string

Context:

File: {fileName}

Previous lines:
{previousLines}

Current line ({lineNumber}):
{currentLine}

Before cursor:
{textBeforeCursor}

After cursor:
{textAfterCursor}

Next lines:
{nextLines}

Full code:
{code}`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      fileName,
      code,
      currentLine,
      previousLines,
      textBeforeCursor,
      textAfterCursor,
      nextLines,
      lineNumber,
    } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const prompt = SUGGESTION_PROMPT.replaceAll("{fileName}", fileName)
      .replaceAll("{code}", code)
      .replaceAll("{currentLine}", currentLine)
      .replaceAll("{previousLines}", previousLines || "")
      .replaceAll("{textBeforeCursor}", textBeforeCursor)
      .replaceAll("{textAfterCursor}", textAfterCursor)
      .replaceAll("{nextLines}", nextLines || "")
      .replaceAll("{lineNumber}", lineNumber.toString());

    let aiModel;
    let isFallback = false;

    try {
      // 1. Try to reserve a Gemini model from Convex
      const modelName = await fetchMutation(
        api.GeminiAi.reserveSuggestionModel,
      );
      console.log(`[suggestions] using Convex reserved model: ${modelName}`);
      aiModel = google(modelName);
    } catch (routeError) {
      // 2. All Gemini quotas exhausted in Convex -> start with fallback
      console.warn(
        "[suggestions] Convex quotas exhausted. Starting with fallback:",
        routeError,
      );
      aiModel = MODELS.suggestionFallback;
      isFallback = true;
    }

    const runGeneration = async (modelToUse: any) => {
      const { output } = await generateText({
        model: modelToUse,
        output: Output.object({
          schema: suggestionSchema,
        }),
        prompt,
        temperature: 0,
        maxOutputTokens: 128,
        maxRetries: 0,
      });
      return output?.suggestion ?? "";
    };

    try {
      // Attempt generation with chosen model
      const suggestion = await runGeneration(aiModel);
      return NextResponse.json({ suggestion });
    } catch (generationError: any) {
      // Safely handle empty parsing / intentional empty outputs
      if (
        generationError?.name === "AI_NoOutputGeneratedError" ||
        generationError?.name === "JSONParseError" ||
        generationError?.name === "TypeValidationError"
      ) {
        return NextResponse.json({ suggestion: "" });
      }

      // If the API throws 429/RESOURCE_EXHAUSTED and we HAVEN'T tried the fallback yet
      if (
        !isFallback &&
        (generationError?.message?.includes("429") ||
          generationError?.message?.includes("RESOURCE_EXHAUSTED") ||
          generationError?.message?.includes("exceeded your current quota"))
      ) {
        console.warn(
          "[suggestions] Primary model rejected with 429/Quota. Activating fallback.",
        );
        try {
          const fallbackSuggestion = await runGeneration(
            MODELS.suggestionFallback,
          );
          return NextResponse.json({ suggestion: fallbackSuggestion });
        } catch (fallbackError: any) {
          if (
            fallbackError?.name === "AI_NoOutputGeneratedError" ||
            fallbackError?.name === "JSONParseError" ||
            fallbackError?.name === "TypeValidationError"
          ) {
            return NextResponse.json({ suggestion: "" });
          }
          // If the fallback ALSO throws 429, then return 429 to client
          if (
            fallbackError?.message?.includes("429") ||
            fallbackError?.message?.includes("RESOURCE_EXHAUSTED") ||
            fallbackError?.message?.includes("exceeded your current quota")
          ) {
            return NextResponse.json({ suggestion: "" }, { status: 429 });
          }
          throw fallbackError;
        }
      }

      // If we were already on fallback and it 429'd
      if (
        isFallback &&
        (generationError?.message?.includes("429") ||
          generationError?.message?.includes("RESOURCE_EXHAUSTED") ||
          generationError?.message?.includes("exceeded your current quota"))
      ) {
        return NextResponse.json({ suggestion: "" }, { status: 429 });
      }

      throw generationError;
    }
  } catch (error) {
    console.error("Suggestion error:", error);

    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 },
    );
  }
}
