import { supabase } from "../../../config/supabase";

/**
 * Fetches questions by their IDs or by passage IDs.
 * This allows fetching both specific questions and all questions from specific passages.
 * @param questionsIds - Array of question IDs to fetch directly
 * @param passageIds - Array of passage IDs to fetch all associated questions
 */
export async function fetchQuestionsData(questionsIds: string[], passageIds: string[]) {
    console.log(
        `❓ [Questions] Fetching questions from DB (questionIds=${questionsIds.length}, passageIds=${passageIds.length})`
    );

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .or(`id.in.(${questionsIds.join(',')}),passage_id.in.(${passageIds.join(',')})`);

    if (error) {
        console.error("❌ [Questions] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Questions] Loaded ${data?.length} records`);
    return data;
}