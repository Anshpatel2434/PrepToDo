import { supabase } from "../../../config/supabase";
import { Question } from "../schemas/types";

/**
 * Fetches multiple questions from the 'questions' table based on an array of IDs.
 */
export async function fetchQuestionsData(questionIds: string[]): Promise<Question[]> {
    console.log(`🔍 [Questions Fetch] Fetching ${questionIds.length} questions`);

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (error) {
        console.error("❌ [Questions Fetch] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Questions Fetch] Loaded ${data?.length || 0} questions`);
    return data || [];
}
