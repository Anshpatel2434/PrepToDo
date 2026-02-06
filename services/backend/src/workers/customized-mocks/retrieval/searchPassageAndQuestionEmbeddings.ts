import { db } from "../../../db";
import { sql, inArray } from "drizzle-orm";
import * as schema from "../../../db/schema";

/**
 * Searches for similar passages and questions using vector embeddings.
 * Uses raw SQL since Drizzle doesn't have native pgvector support.
 */
export async function searchPassageAndQuestionEmbeddings(
    queryEmbedding: number[],
    topK = 5
) {
    console.log(`🔎 [Vector Search] Searching similar passages/questions (topK=${topK})`);

    // Convert embedding array to postgres vector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Search passages using custom function
    const passageData = await db.execute(sql`
        SELECT * FROM search_passage_embeddings(
            ${embeddingStr}::vector,
            ${topK}
        )
    `);

    console.log(`🔎 [Vector Search] Searching similar questions by type (perType=${topK})`);

    // Search questions using custom function
    const questionsData = await db.execute(sql`
        SELECT * FROM search_question_embeddings_by_type(
            ${embeddingStr}::vector,
            ${topK}
        )
    `);

    const passages = passageData.rows || [];
    const questions = questionsData.rows || [];

    // Extract IDs
    const passageIds = passages.map((p: any) => p.passage_id || p.id).filter(Boolean);
    const questionIds = questions.map((q: any) => q.question_id || q.id).filter(Boolean);

    // Fetch full data if IDs exist
    let enrichedPassages: any[] = [];
    let enrichedQuestions: any[] = [];

    if (passageIds.length > 0) {
        const fullPassages = await db.select().from(schema.passages).where(inArray(schema.passages.id, passageIds));

        // Map back to preserve order/score if needed, or just return full objects
        // We'll merge the score from vector search with full data
        enrichedPassages = passages.map((p: any) => {
            const fullData = fullPassages.find(fp => fp.id === (p.passage_id || p.id));
            return fullData ? { ...fullData, score: p.score } : p;
        }).filter((p: any) => p.content); // Ensure we have content
    }

    if (questionIds.length > 0) {
        const fullQuestions = await db.select().from(schema.questions).where(inArray(schema.questions.id, questionIds));

        enrichedQuestions = questions.map((q: any) => {
            const fullData = fullQuestions.find(fq => fq.id === (q.question_id || q.id));
            return fullData ? { ...fullData, score: q.score } : q;
        }).filter((q: any) => q.question_text);
    }

    console.log(`✅ [Vector Search] Retrieved ${enrichedPassages.length} full passages, ${enrichedQuestions.length} full questions`);
    if (enrichedPassages.length > 0) {
        console.log(`🔍 [Vector Search] First Enriched Passage Sample: ${JSON.stringify(enrichedPassages[0]).substring(0, 200)}...`);
    }

    return {
        passages: enrichedPassages,
        questions: enrichedQuestions
    };
}
