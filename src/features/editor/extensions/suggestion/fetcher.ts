import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { z } from "zod";

const suggestionRequestSchema = z.object({
  fileName: z.string(),
  code: z.string(),
  currentLine: z.string(),
  previousLines: z.string(),
  textBeforeCursor: z.string(),
  textAfterCursor: z.string(),
  nextLines: z.string(),
  lineNumber: z.number(),
});

const suggestionResponseSchema = z.object({
  suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

export const fetcher = async (
  payload: SuggestionRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = suggestionRequestSchema.parse(payload);

    const response = await ky
      .post("/api/suggestion", {
        json: validatedPayload,
        signal,
        timeout: 3000,
        retry: 0,
      })
      .json<SuggestionResponse>();

    const validatedResponse = suggestionResponseSchema.parse(response);

    return validatedResponse.suggestion || null;
  } catch (error) {
    // Abort / timeout — expected during rapid typing
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      return null;
    }

    // 429 — all models rate-limited (including fallback), notify user
    if (error instanceof HTTPError && error.response.status === 429) {
      toast.error("All AI quotas exhausted. Please try again in a minute.", {
        id: "ai-quota-error",
      });
      return null;
    }

    toast.error("Failed to fetch AI suggestion", {
      id: "ai-suggestion-error",
    });

    return null;
  }
};
