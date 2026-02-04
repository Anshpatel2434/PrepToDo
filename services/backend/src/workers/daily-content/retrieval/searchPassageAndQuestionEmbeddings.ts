import { createChildLogger } from "../../../common/utils/logger.js";
import { db } from "../../../db/index.js";

const logger = createChildLogger("daily-content");

export async function searchPassageAndQuestionEmbeddings(
    queryEmbedding: number[],
    topK = 5
) {
    logger.debug(
        { topK },
        "🔎 [Vector Search] Searching similar passages/questions"
    );

    // Migrated from Supabase RPC to Drizzle ORM
    // Using raw SQL to call the same PostgreSQL functions
    try {
        // Search for similar passages
        const passageResult = await db.execute(
            `SELECT * FROM search_passage_embeddings($1, $2)`,
            [queryEmbedding, topK]
        );
        const passageData = passageResult.rows;

        // Search for similar questions by type
        const questionsResult = await db.execute(
            `SELECT * FROM search_question_embeddings_by_type($1, $2)`,
            [queryEmbedding, topK]
        );
        const questionsData = questionsResult.rows;

        logger.info(
            { passages: passageData.length, questions: questionsData.length },
            "✅ [Vector Search] Retrieved results"
        );

        return {
            passages: passageData,
            questions: questionsData
        };
    } catch (error) {
        logger.error(
            { error },
            "❌ [Vector Search] Failed to search embeddings"
        );
        throw error;
    }
}
