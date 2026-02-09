// =============================================================================
// Daily Content Worker - Search Passage and Question Embeddings
// =============================================================================
// Refactored for Drizzle ORM - Uses raw SQL for vector search

import { db } from "../../../db/index";
import { sql } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('vector-search');

/**
 * Searches for similar passages and questions using vector embeddings.
 * Uses raw SQL since Drizzle doesn't have native pgvector support.
 */
export async function searchPassageAndQuestionEmbeddings(
    queryEmbedding: number[],
    topK = 5
) {
    logger.info(`🔎 [Vector Search] Searching similar passages/questions (topK=${topK})`);

    // Convert embedding array to postgres vector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Search passages using custom function
    const passageData = await db.execute(sql`
        SELECT * FROM search_passage_embeddings(
            ${embeddingStr}::vector,
            ${topK}
        )
    `);

    logger.info(`🔎 [Vector Search] Searching similar questions by type (perType=${topK})`);

    // Search questions using custom function
    const questionsData = await db.execute(sql`
        SELECT * FROM search_question_embeddings_by_type(
            ${embeddingStr}::vector,
            ${topK}
        )
    `);

    const passages = passageData.rows || [];
    const questions = questionsData.rows || [];

    logger.info(`✅ [Vector Search] Retrieved ${passages.length} passages, ${questions.length} questions`);

    return {
        passages,
        questions
    };
}
