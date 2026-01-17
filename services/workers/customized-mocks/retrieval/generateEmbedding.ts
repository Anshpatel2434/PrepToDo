import OpenAI from "openai";
import { openai } from "../../../config/openai";

const client = openai;
const MODEL = "text-embedding-3-small";

/**
 * Generates an embedding for the given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    console.log("⏳ [Embedding] Generating vector for search query");

    const response = await client.embeddings.create({
        model: MODEL,
        input: text,
    });

    const embedding = response.data[0].embedding;
    console.log(`✅ [Embedding] Generated ${embedding.length} dimensions`);
    return embedding;
}
