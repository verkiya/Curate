// lib/ai/suggestion-model-router.ts
//
// Weighted round-robin router for Gemini suggestion models.
// Tracks per-minute usage in-process and enforces a 60 % safety margin
// so the API is never hit harder than necessary.
//
// ⚠️  Single-process only.  If you scale to multiple server instances,
//     move the counters into Redis / Upstash / Convex.

const MODELS = [
  {
    name: "gemini-3.5-flash", // Cutting-edge fast model
    rpm: 15,
    weight: 10,
  },
  {
    name: "gemini-3.1-flash-lite-preview", // Great for completions
    rpm: 15,
    weight: 8,
  },
  {
    name: "gemini-2.5-flash-lite", // Fallback lightweight model
    rpm: 10,
    weight: 5,
  },
  {
    name: "gemini-2.5-flash", // Stable standard model
    rpm: 5,
    weight: 2,
  },
] as const;

const SAFETY_FACTOR = 0.6;

type ModelName = (typeof MODELS)[number]["name"];

type UsageEntry = {
  requests: number;
  resetAt: number;
};

/** In-memory usage counters — one entry per model. */
const usage = new Map<ModelName, UsageEntry>();

let roundRobinCounter = 0;

/**
 * Return (or create) the usage entry for `model`.
 * Automatically resets the counter once the 60-second window expires.
 */
function getUsage(model: ModelName): UsageEntry {
  const now = Date.now();
  const existing = usage.get(model);

  if (!existing || now >= existing.resetAt) {
    const fresh: UsageEntry = {
      requests: 0,
      resetAt: now + 60_000,
    };
    usage.set(model, fresh);
    return fresh;
  }

  return existing;
}

/** Return only models whose safe limit has not been reached. */
function availableModels() {
  return MODELS.filter((model) => {
    const stats = getUsage(model.name);
    const safeLimit = Math.max(1, Math.floor(model.rpm * SAFETY_FACTOR));
    return stats.requests < safeLimit;
  });
}

/**
 * Pick and reserve a model for one suggestion request.
 *
 * @returns The model name string to pass to `google(modelName)`.
 * @throws  If every model is at its safe limit.
 */
export function reserveSuggestionModel(): ModelName {
  const candidates = availableModels();

  if (candidates.length === 0) {
    throw new Error(
      "All Gemini suggestion models are at their safe rate limit.",
    );
  }

  // Build a weighted pool: heavier weight → more entries → picked more often
  const weightedPool: ModelName[] = [];
  for (const model of candidates) {
    for (let i = 0; i < model.weight; i++) {
      weightedPool.push(model.name);
    }
  }

  const selected = weightedPool[roundRobinCounter % weightedPool.length];
  roundRobinCounter++;

  // Increment the counter for the selected model
  const stats = getUsage(selected);
  stats.requests++;

  return selected;
}

/**
 * Return current usage stats for every model (useful for debugging).
 */
export function getSuggestionModelStats() {
  return MODELS.map((model) => {
    const stats = getUsage(model.name);
    return {
      model: model.name,
      requests: stats.requests,
      safeLimit: Math.floor(model.rpm * SAFETY_FACTOR),
      resetInSeconds: Math.max(
        0,
        Math.ceil((stats.resetAt - Date.now()) / 1000),
      ),
    };
  });
}
