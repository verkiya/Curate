import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export const MODELS = {
  // Fast, cheap, latency-sensitive completions
  autocomplete: [
    google("gemini-2.5-flash"),
    google("gemini-2.5-flash-lite"),
    openai("gpt-5.4-nano"),
    openai("gpt-5-mini"),
    anthropic("claude-haiku-4-5-20251001"),
  ],

  // Fallback for when Convex Gemini quotas are exhausted
  suggestionFallback: openai("gpt-5.4-nano"),

  // Code editing
  quickEdit: anthropic("claude-sonnet-4-6"),

  // Larger code generation tasks
  codeGeneration: anthropic("claude-sonnet-4-6"),

  // General chat
  chat: openai("gpt-5-mini"),

  // Chat fallback chain
  chatFallbacks: [
    openai("gpt-5.4-nano"),
    anthropic("claude-haiku-4-5-20251001"),
  ],

  // Utility generations
  titleGeneration: openai("gpt-5.4-nano"),

  commitMessages: openai("gpt-5.4-nano"),

  fileRenameSuggestions: openai("gpt-5.4-nano"),

  // Premium / architecture / complex repo analysis
  premiumReasoning: anthropic("claude-opus-4-8"),
} as const;
