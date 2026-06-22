// Tiered Model Strategy
// We split tasks between fast/cheap models (Haiku, Gemini Flash) and capable/expensive models (Sonnet, Opus).
// This reduces token costs for high-frequency operations like suggestions and titles, while preserving reasoning power for agents.
export const CLAUDE_MODELS = {
  // Fast, cheap, latency-sensitive tasks (autocomplete fallback, simple edits, chat fallbacks, title generation)
  haiku: "claude-haiku-4-5-20251001",

  // Balanced, highly capable tasks (large edits, primary chat, code generation)
  sonnet: "claude-sonnet-4-6",

  // Deep reasoning, architecture, extremely complex tasks
  // Defined as inventory, not an active route. Wire Opus through an explicit escalation path
  // before using it so cost, latency, and cancellation behavior stay intentional.
  opus: "claude-opus-4-8",
} as const;

export const GEMINI_MODELS = [
  {
    name: "gemini-3.5-flash",
    rpm: 15,
    weight: 10,
  },
  {
    name: "gemini-2.5-flash-lite",
    rpm: 10,
    weight: 5,
  },
  {
    name: "gemini-2.5-flash",
    rpm: 5,
    weight: 2,
  },
  {
    name: "gemini-2.0-flash",
    rpm: 5,
    weight: 1,
  },
  {
    name: "gemini-2.0-flash-lite",
    rpm: 5,
    weight: 1,
  },
] as const;
