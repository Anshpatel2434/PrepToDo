import { supabase } from "../../../config/supabase";

export interface EmbeddingMatch {
    passage_id: string;
    question_id: string;
    similarity: number;
}

/**
 * Searches for similar passages and questions using vector similarity.
 * Returns top N matches for each.
 */
export async function searchPassageAndQuestionEmbeddings(
    embedding: number[],
    topN: number = 5
): Promise<{ passages: EmbeddingMatch[], questions: EmbeddingMatch[] }> {
    console.log(`🔍 [Vector Search] Searching for top ${topN} similar passages and questions`);

    // Call Supabase RPC function for vector search
    const { data: passageMatches, error: passageError } = await supabase.rpc('match_passages', {
        query_embedding: embedding,
        match_threshold: 0.75,
        match_count: topN,
    });

    if (passageError) {
        console.error("❌ [Vector Search] Error searching passages:", passageError.message);
        // Fallback: return empty results
        return { passages: [], questions: [] };
    }

    const { data: questionMatches, error: questionError } = await supabase.rpc('match_questions', {
        query_embedding: embedding,
        match_threshold: 0.75,
        match_count: topN,
    });

    if (questionError) {
        console.error("❌ [Vector Search] Error searching questions:", questionError.message);
    }

    console.log(`✅ [Vector Search] Found ${passageMatches?.length || 0} passages, ${questionMatches?.length || 0} questions`);

    return {
        passages: passageMatches || [],
        questions: questionMatches || [],
    };
}
