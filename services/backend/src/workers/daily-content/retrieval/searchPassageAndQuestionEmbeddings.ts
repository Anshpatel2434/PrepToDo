import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

export async function searchPassageAndQuestionEmbeddings(
    queryEmbedding: number[],
    topK = 5
) {
    logger.debug(
        { topK },
        "🔎 [Vector Search] Searching similar passages/questions"
    );

    // NOTE: These are Supabase RPC calls to PostgreSQL functions.
    // In Drizzle ORM with direct PostgreSQL, these would be:
    // - Direct SQL function calls using db.execute()
    // - Or reimplemented as Drizzle queries if the functions are migrated
    // For now, keeping the RPC calls as they reference existing DB functions
    const { data: passageData, error: passageError } = await supabase.rpc("search_passage_embeddings", {
        query_embedding: queryEmbedding,
        match_count: topK,
    });

    if (passageError) {
        logger.error(
            { error: passageError },
            "❌ [Vector Search] Failed for passages"
        );
        throw passageError;
    }

    logger.debug(
        { perType: topK },
        "🔎 [Vector Search] Searching similar questions by type"
    );

    const { data: questionsData, error: questionsError } = await supabase.rpc("search_question_embeddings_by_type", {
        query_embedding: queryEmbedding,
        match_per_type: topK,
    });

    if (questionsError) {
        logger.error(
            { error: questionsError },
            "❌ [Vector Search] Failed for questions"
        );
        throw questionsError;
    }

    logger.info(
        { passages: passageData.length, questions: questionsData.length },
        "✅ [Vector Search] Retrieved results"
    );

    return {
        passages: passageData,
        questions: questionsData
    };
}
