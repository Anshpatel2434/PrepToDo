import { supabase } from "../../config/supabase";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param questionsIds - An array of 5 strings (IDs)
 */
export async function fetchQuestionsData(questionsIds: string[], passageIds: string[]) {
    console.log("📘 [Questions] Fetching multiple IDs:", questionsIds);

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