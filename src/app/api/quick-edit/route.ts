import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";
import { auth } from "@clerk/nextjs/server";
import { MODELS } from "@/lib/ai-model";

const requestSchema = z.object({
  selectedCode: z.string().min(1),
  fullCode: z.string().optional(),
  instruction: z.string().min(1),
});

const quickEditSchema = z.object({
  editedCode: z
    .string()
    .describe(
      "The edited version of the selected code based on the instruction",
    ),
});

const URL_REGEX = /https?:\/\/[^\s)>\]]+/g;

const MAX_URLS = 3;
const MAX_DOC_CHARS = 3000;
const MAX_FULL_CODE_CHARS = 15000;

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>

<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the final edited code.

Do not modify code outside the selected code.

Preserve:
- existing indentation
- existing formatting
- existing quotation style
- surrounding syntax
- line endings where possible

Never explain changes.
Never summarize changes.
Never wrap in markdown.
Never use code fences.
Never include surrounding code.

Return only the edited selection.

If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

function timeout(ms: number) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms),
  );
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = requestSchema.parse(await request.json());

    const { selectedCode, fullCode, instruction } = body;

    const urls = [...new Set(instruction.match(URL_REGEX) || [])].slice(
      0,
      MAX_URLS,
    );

    let documentationContext = "";

    if (urls.length > 0) {
      const scrapedResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const result = await Promise.race([
              firecrawl.scrape(url, {
                formats: ["markdown"],
              }),
              timeout(5000),
            ]);

            if (
              !result ||
              typeof result !== "object" ||
              !("markdown" in result) ||
              typeof (result as any).markdown !== "string"
            ) {
              return null;
            }

            const trimmedMarkdown = ((result as any).markdown as string).slice(
              0,
              MAX_DOC_CHARS,
            );

            return `<doc url="${url}">
${trimmedMarkdown}
</doc>`;
          } catch {
            return null;
          }
        }),
      );

      const validResults = scrapedResults.filter(Boolean);

      if (validResults.length > 0) {
        documentationContext = `<documentation>
${validResults.join("\n\n")}
</documentation>`;
      }
    }

    const trimmedFullCode =
      fullCode && fullCode.length > MAX_FULL_CODE_CHARS
        ? `${fullCode.slice(0, MAX_FULL_CODE_CHARS / 2)}\n\n...TRUNCATED...\n\n${fullCode.slice(-(MAX_FULL_CODE_CHARS / 2))}`
        : fullCode || "";

    const prompt = QUICK_EDIT_PROMPT.replace("{selectedCode}", selectedCode)
      .replace("{fullCode}", trimmedFullCode)
      .replace("{instruction}", instruction)
      .replace("{documentation}", documentationContext);

    const model =
      selectedCode.length > 1500 ? MODELS.quickEdit : MODELS.quickEditFast;

    const { output } = await generateText({
      model,
      output: Output.object({
        schema: quickEditSchema,
      }),
      prompt,
      maxRetries: 0,
      temperature: 0,
      maxOutputTokens: 600,
    });

    return NextResponse.json({
      editedCode: output.editedCode,
      changed: output.editedCode !== selectedCode,
    });
  } catch (error) {
    console.error("Edit error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate edited code. Please try again.",
      },
      { status: 500 },
    );
  }
}
