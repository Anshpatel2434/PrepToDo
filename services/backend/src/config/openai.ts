import OpenAI from "openai";

// Ensure OPENAI_API_KEY is present
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY is not set in environment variables. Analytics requiring LLM will fail.");
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
