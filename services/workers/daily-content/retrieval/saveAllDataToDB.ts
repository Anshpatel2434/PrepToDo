import { supabase } from "../../../config/supabase";

/**
 * Saves article metadata into the database
 */
export async function saveAllDataToDB({ examData, passageData, questionsData }: any) {
    try {
        console.log("💾 [Database] Starting save operation...");

        // 1. Save Exam Paper
        const { data: examResponse, error: examError } = await supabase
            .from("exam_papers")
            .insert([examData])
            .select();

        if (examError) throw new Error(`Exam Insert: ${examError.message}`);
        console.log("📄 [DB Save] Exam Paper metadata saved");

        // 2. Save Passage
        const { data: passageResponse, error: passageError } = await supabase
            .from("passages")
            .insert([passageData])
            .select();

        if (passageError) throw new Error(`Passage Insert: ${passageError.message}`);
        console.log("📄 [DB Save] Passage content saved");

        // 3. Save Questions
        const { data: questionsResponse, error: questionsError } = await supabase
            .from("questions")
            .insert(questionsData) // Assuming questionsData is an array
            .select();

        if (questionsError) throw new Error(`Questions Insert: ${questionsError.message}`);
        console.log("✅ [DB Save] All data persisted successfully");

        return {
            exam: examResponse,
            passage: passageResponse,
            questions: questionsResponse
        };

    } catch (error) {
        console.error(
            `❌ [DB Save Failed]:`,
            error instanceof Error ? error.message : String(error)
        );
        // Re-throw the error so the calling function (getValidArticleWithText) can catch it
        throw error;
    }
}