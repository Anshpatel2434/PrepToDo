import OpenAI from "openai";
import { logger } from "../common/utils/logger.js";

// Ensure OPENAI_API_KEY is present
if (!process.env.OPENAI_API_KEY) {
    logger.warn("⚠️ OPENAI_API_KEY is not set in environment variables. Analytics requiring LLM will fail.");
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
