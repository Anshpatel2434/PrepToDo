import { openai } from "../../../config/openai";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('embedding-gen');

export async function generateEmbedding(text: string) {
    logger.info("🧠 [Embedding] Generating query embedding");

    logger.info("⏳ [Embedding] Waiting for OpenAI embeddings response");

    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    logger.info("✅ [Embedding] Vector generated");

    return response.data[0].embedding;
}
