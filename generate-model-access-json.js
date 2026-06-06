#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: ".env.local" });

const CLAUDE_PRICING = {
  "claude-opus-4-7": { input: 5.0, output: 25.0 },
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-opus-4-5": { input: 5.0, output: 25.0 },
  "claude-opus-4-5-20251101": { input: 5.0, output: 25.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
  "claude-opus-4-20250514": { input: 15.0, output: 75.0 },
  "claude-opus-4-1": { input: 15.0, output: 75.0 },
  "claude-opus-4-1-20250805": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-3-5-20241022": { input: 0.8, output: 4.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  "claude-haiku-3-20240307": { input: 0.25, output: 1.25 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
};

const OPENAI_PRICING = {
  "gpt-5.4-nano": { input: 0.15, output: 0.6 },
  "gpt-5-mini": { input: 0.15, output: 0.6 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
};

const CLAUDE_RELEVANT_MODEL = /^claude-(opus|sonnet|haiku)-4-(8|7|6|5)(?:-|$)/;
const GOOGLE_RELEVANT_MODEL = /^(models\/(gemini-(2\.5|3(?:\.1)?|3\.5)|gemma-4))/;
const GOOGLE_EXCLUDED_MODEL = /(image|imagen|veo|tts|audio|live|embedding|aqa|research|robotics|computer-use|antigravity|banana|lyria)/i;
const OPENAI_RELEVANT_MODEL = /^(gpt-5\.(5|4)|gpt-5\.(3|2)-codex)/;
const OPENAI_EXCLUDED_MODEL = /(image|audio|tts|transcribe|whisper|embedding|search|realtime|sora|moderation)/i;

function pricingOrNull(pricingMap, modelId) {
  const pricing = pricingMap[modelId];

  if (!pricing) {
    return null;
  }

  return {
    currency: "USD",
    inputPerMillionTokens: pricing.input,
    outputPerMillionTokens: pricing.output,
  };
}

function isRelevantClaudeModel(modelId) {
  return CLAUDE_RELEVANT_MODEL.test(modelId);
}

function isRelevantGoogleModel(modelId) {
  return GOOGLE_RELEVANT_MODEL.test(modelId) && !GOOGLE_EXCLUDED_MODEL.test(modelId);
}

function isRelevantOpenAiModel(modelId) {
  return OPENAI_RELEVANT_MODEL.test(modelId) && !OPENAI_EXCLUDED_MODEL.test(modelId);
}

function cleanDate(value) {
  if (value == null) {
    return null;
  }

  const date =
    typeof value === "number" ? new Date(value * 1000) : new Date(value);

  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

async function listClaudeModels(apiKey) {
  const models = [];
  let nextPage = null;

  do {
    const url = new URL("https://api.anthropic.com/v1/models");

    if (nextPage) {
      url.searchParams.set("after_id", nextPage);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const data = await response.json();

    for (const model of data.data ?? []) {
      if (!isRelevantClaudeModel(model.id)) {
        continue;
      }

      models.push({
        provider: "anthropic",
        id: model.id,
        displayName: model.display_name ?? null,
        createdAt: cleanDate(model.created_at),
        pricing: pricingOrNull(CLAUDE_PRICING, model.id),
        maxInputTokens: model.max_input_tokens ?? null,
        maxOutputTokens: model.max_tokens ?? null,
      });
    }

    nextPage = data.has_more ? data.last_id : null;
  } while (nextPage);

  return models;
}

async function listGoogleModels(apiKey) {
  const client = new GoogleGenAI({ apiKey });
  const pager = await client.models.list();
  const models = [];

  for await (const model of pager) {
    if (!isRelevantGoogleModel(model.name)) {
      continue;
    }

    models.push({
      provider: "google",
      id: model.name,
      displayName: model.displayName ?? null,
      createdAt: null,
      pricing: null,
      tokenLimits: {
        input: model.inputTokenLimit ?? null,
        output: model.outputTokenLimit ?? null,
      },
      supportedActions: model.supportedActions ?? [],
    });
  }

  return models;
}

async function listOpenAiModels(apiKey) {
  const client = new OpenAI({ apiKey });
  const response = await client.models.list();
  const models = response.data ?? [];

  return models
    .filter((model) => isRelevantOpenAiModel(model.id))
    .map((model) => ({
      provider: "openai",
      id: model.id,
      createdAt: cleanDate(model.created),
      ownedBy: model.owned_by,
      category: classifyOpenAiModel(model.id),
      pricing: pricingOrNull(OPENAI_PRICING, model.id),
    }));
}

function classifyOpenAiModel(id) {
  const lower = id.toLowerCase();

  if (lower.includes("gpt")) return "gpt";
  if (lower.includes("embedding")) return "embedding";
  if (lower.includes("tts")) return "tts";
  if (lower.includes("whisper")) return "speech";
  if (lower.includes("dall")) return "image";
  if (lower.includes("omni")) return "omni";
  if (lower.includes("moderation")) return "moderation";

  return "other";
}

function summarize(modelsByProvider) {
  const providers = Object.fromEntries(
    Object.entries(modelsByProvider).map(([provider, models]) => [
      provider,
      {
        count: models.length,
        models,
      },
    ]),
  );

  const allModels = Object.values(modelsByProvider).flat();

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      providerCount: Object.keys(modelsByProvider).length,
      totalModelCount: allModels.length,
    },
    providers,
    allModels,
  };
}

async function main() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey && !googleKey && !openAiKey) {
    throw new Error(
      "No API keys found. Set ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OPENAI_API_KEY in .env.local.",
    );
  }

  const modelsByProvider = {};

  if (anthropicKey) {
    modelsByProvider.anthropic = await listClaudeModels(anthropicKey);
  }

  if (googleKey) {
    modelsByProvider.google = await listGoogleModels(googleKey);
  }

  if (openAiKey) {
    modelsByProvider.openai = await listOpenAiModels(openAiKey);
  }

  const payload = summarize(modelsByProvider);
  await writeFile("./models.json", `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
  });

  console.log(
    `Wrote models.json with ${payload.summary.totalModelCount} model(s) across ${payload.summary.providerCount} provider(s).`,
  );
}

main().catch((error) => {
  console.error("Model export failed:", error?.message ?? error);
  process.exit(1);
});