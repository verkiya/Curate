#!/usr/bin/env node
/**
 * check-claude-models.js
 *
 * Lists all Claude models your API key can access,
 * along with known pricing where available.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node check-claude-models.js
 *
 *   Or set the key inline (not recommended for shared environments):
 *   node check-claude-models.js sk-ant-...
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.ANTHROPIC_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error("❌  No API key found.");
  console.error(
    "    Set ANTHROPIC_API_KEY as an environment variable, or pass it as the first argument.\n",
  );
  process.exit(1);
}

// ─── Known pricing (USD per million tokens) ───────────────────────────────────
// Source: Anthropic pricing page, May 2026.
// Models not listed here will show "—" for cost.
const PRICING = {
  // Current generation
  "claude-opus-4-7": { input: 5.0, output: 25.0 },
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  // Older / deprecated (still callable until retirement)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return n != null ? `$${n.toFixed(2)}` : "—";
}

function col(str, width) {
  return String(str).padEnd(width);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔍  Fetching models from Anthropic API…\n");

  let allModels = [];
  let nextPage = null;

  // The endpoint is paginated; collect every page.
  do {
    const url = new URL("https://api.anthropic.com/v1/models");
    if (nextPage) url.searchParams.set("after_id", nextPage);

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`❌  API error ${res.status}: ${body}`);
      process.exit(1);
    }

    const data = await res.json();
    allModels = allModels.concat(data.data ?? []);
    nextPage = data.has_more ? data.last_id : null;
  } while (nextPage);

  if (allModels.length === 0) {
    console.log("No models returned. Your key may have restricted access.");
    return;
  }

  // ── Print table ──────────────────────────────────────────────────────────────
  const W = { id: 42, created: 12, input: 14, output: 14 };
  const header =
    col("Model ID", W.id) +
    col("Created", W.created) +
    col("Input ($/MTok)", W.input) +
    "Output ($/MTok)";
  const divider = "─".repeat(header.length);

  console.log(`Found ${allModels.length} model(s) accessible with your key:\n`);
  console.log(header);
  console.log(divider);

  for (const model of allModels) {
    const pricing = PRICING[model.id];
    let created = "—";
    if (model.created_at) {
      // API may return a Unix timestamp (number) or an ISO string
      const d =
        typeof model.created_at === "number"
          ? new Date(model.created_at * 1000)
          : new Date(model.created_at);
      created = isNaN(d)
        ? String(model.created_at).slice(0, 10)
        : d.toISOString().slice(0, 10);
    }
    console.log(
      col(model.id, W.id) +
        col(created, W.created) +
        col(fmt(pricing?.input), W.input) +
        fmt(pricing?.output),
    );
  }

  console.log(divider);
  console.log(
    "\nNote: Pricing figures are per million tokens (MTok), as of May 2026.",
  );
  console.log(
    "      '—' means the model ID wasn't found in the embedded price list.",
  );
  console.log(
    "      Batch API is 50% cheaper; prompt caching cuts cached input by ~90%.",
  );
  console.log(
    "      Always verify current prices at: https://platform.claude.com/docs/en/about-claude/pricing\n",
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
