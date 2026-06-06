import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
  const result = await ai.models.list();

  console.dir(result, {
    depth: null,
  });
}

main();
