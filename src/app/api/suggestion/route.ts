// Inline suggestion completion route
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { CLAUDE_MODELS } from "@/lib/ai-models";

const suggestionSchema = z.object({
  suggestion: z
    .string()
    .describe(
      "The exact code to insert at the cursor, or empty string if no completion is needed",
    ),
});

const SUGGESTION_PROMPT = `You are an inline code completion engine.

<context>
<file_name>{fileName}</file_name>

<previous_lines>
{previousLines}
</previous_lines>

<current_line number="{lineNumber}">
{currentLine}
</current_line>

<before_cursor>
{textBeforeCursor}
</before_cursor>

<after_cursor>
{textAfterCursor}
</after_cursor>

<next_lines>
{nextLines}
</next_lines>

<full_code>
{code}
</full_code>
</context>

<instructions>
Follow these steps IN ORDER:

1. First, inspect next_lines.
   If next_lines already contains the exact same code that would logically follow the cursor, you must return an EMPTY STRING immediately. This means the user is just moving their cursor through existing code.

2. Check the text before the cursor.
   If it ends with a complete statement (like a semicolon, a closing bracket "}", or a closing parenthesis ")") and there is no obvious incomplete statement, you must return an EMPTY STRING immediately.

3. Only if steps 1 and 2 do not apply:
   Suggest the exact characters that should be typed directly at the cursor position to complete the current thought, using context from full_code.

Return ONLY the exact code that should be inserted at the cursor.

STRICT RULES:
- Return code only
- No markdown
- Do not wrap in backticks
- Do not repeat code that is already in textBeforeCursor
- Do not repeat code that is already in textAfterCursor or nextLines
- If no completion is appropriate, return an empty string
</instructions>`;

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
      textBeforeCursor,
      textAfterCursor,
      lineNumber,
      previousLines,
      nextLines,
    } = await request.json();

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
      // 1. Try to reserve a Gemini model from Convex.
      // We use Gemini first for suggestions because it provides extremely high RPM limits,
      // which is critical for high-frequency operations like ghost text autocomplete.
      const modelName = await fetchMutation(
        api.GeminiAi.reserveSuggestionModel,
      );
      console.log(`[suggestions] using Convex reserved model: ${modelName}`);
      aiModel = google(modelName);
    } catch (routeError) {
      // 2. All Gemini quotas exhausted in Convex -> start with fallback
      // If the user types too fast and hits the 95% safety margin of Gemini,
      // we immediately switch to Claude Haiku to ensure suggestions don't just silently stop.
      console.warn(
        "[suggestions] Convex quotas exhausted. Starting with fallback:",
        routeError,
      );
      aiModel = anthropic(CLAUDE_MODELS.haiku);
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
      // Triple Error Handling Strategy:
      // 1. Parsing errors (model failed to return valid JSON schema) -> gracefully return empty string
      //    instead of crashing the ghost text UI.
      if (
        generationError?.name === "AI_NoOutputGeneratedError" ||
        generationError?.name === "JSONParseError" ||
        generationError?.name === "TypeValidationError"
      ) {
        return NextResponse.json({ suggestion: "" });
      }

      // 2. Rate Limit (429) errors from the provider
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
            anthropic(CLAUDE_MODELS.haiku),
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

      // 3. General unhandled errors
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
