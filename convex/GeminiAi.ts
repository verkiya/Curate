import { mutation } from "./_generated/server";

const MODELS = [
  {
    name: "gemini-3.5-flash",
    rpm: 15,
    weight: 10,
  },
  {
    name: "gemini-2.5-flash-lite",
    rpm: 10,
    weight: 5,
  },{
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

const SAFETY_FACTOR = 0.95;

export const reserveSuggestionModel = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const availableModels = [];

    // Check and reset all models in the database
    for (const model of MODELS) {
      let record = await ctx.db
        .query("aiUsage")
        .withIndex("by_modelName", (q) => q.eq("modelName", model.name))
        .first();

      // If record is missing or the 60s window has expired, reset it
      if (!record || now >= record.resetAt) {
        if (!record) {
          await ctx.db.insert("aiUsage", {
            modelName: model.name,
            requests: 0,
            resetAt: now + 60000,
          });
        } else {
          await ctx.db.patch(record._id, {
            requests: 0,
            resetAt: now + 60000,
          });
        }
        record = {
          modelName: model.name,
          requests: 0,
          resetAt: now + 60000,
        } as any;
      }

      // 95% safety factor
      const safeLimit = Math.max(1, Math.floor(model.rpm * SAFETY_FACTOR));

      if (record && record.requests < safeLimit) {
        availableModels.push(model);
      }
    }

    if (availableModels.length === 0) {
      throw new Error(
        "Rate limited: All Gemini models have reached their 95% safe quota limit.",
      );
    }

    // Build the weighted pool
    const weightedPool: string[] = [];
    for (const model of availableModels) {
      for (let i = 0; i < model.weight; i++) {
        weightedPool.push(model.name);
      }
    }

    // Since we're in Convex, we can just randomly pick from the pool instead of round-robin
    const selected =
      weightedPool[Math.floor(Math.random() * weightedPool.length)];

    // Increment the picked model in Convex
    const pickedRecord = await ctx.db
      .query("aiUsage")
      .withIndex("by_modelName", (q) => q.eq("modelName", selected))
      .first();

    if (pickedRecord) {
      await ctx.db.patch(pickedRecord._id, {
        requests: pickedRecord.requests + 1,
      });
    }

    return selected;
  },
});
