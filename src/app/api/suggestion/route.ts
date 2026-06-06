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

    try {
      // 1. Try to reserve a Gemini model from Convex
      const modelName = await fetchMutation(api.ai.reserveSuggestionModel);
      console.log(`[suggestions] using Convex reserved model: ${modelName}`);
      aiModel = google(modelName);
    } catch (routeError) {
      // 2. All Gemini quotas exhausted -> fallback to OpenAI's cheapest fast model
      console.warn("[suggestions] All Gemini quotas exhausted. Falling back to configured fallback model:", routeError);
      try {
        aiModel = MODELS.suggestionFallback;
      } catch (fallbackError) {
        // If the fallback is not available or fails setup
        return NextResponse.json({ suggestion: "" }, { status: 429 });
      }
    }

    try {
      // Generate structured output using the chosen model
      const { output } = await generateText({
        model: aiModel,
        output: Output.object({
          schema: suggestionSchema,
        }),
        prompt,
        temperature: 0,
        maxOutputTokens: 128,
        maxRetries: 0,
      });

      return NextResponse.json({
        suggestion: output?.suggestion ?? "",
      });
    } catch (generationError: any) {
      // If the model explicitly returned no output (which means it chose not to suggest anything)
      // or if it returned raw code that failed JSON parsing
      if (
        generationError?.name === "AI_NoOutputGeneratedError" ||
        generationError?.name === "JSONParseError" ||
        generationError?.name === "TypeValidationError"
      ) {
        return NextResponse.json({ suggestion: "" });
      }
      
      // If the actual generation fails with 429 (e.g. Anthropic runs out of quota too)
      if (
        generationError?.message?.includes("429") ||
        generationError?.message?.includes("RESOURCE_EXHAUSTED")
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
