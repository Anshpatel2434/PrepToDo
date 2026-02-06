import { openai } from "../../../config/openai";

export async function generateEmbedding(text: string) {
    console.log("🧠 [Embedding] Generating query embedding");

    console.log("⏳ [Embedding] Waiting for OpenAI embeddings response");

    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    console.log("✅ [Embedding] Vector generated");

    return response.data[0].embedding;
}
