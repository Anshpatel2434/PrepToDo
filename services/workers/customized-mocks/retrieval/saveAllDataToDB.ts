import { supabase } from "../../../config/supabase";
import { Exam, Passage, Question } from "../schemas/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves custom mock exam data to database.
 */
export async function saveAllDataToDB(params: {
    examData: Exam;
    passagesData: Passage[];
    questionsData: Question[];
}): Promise<{
    exam: any;
    passages: any[];
    questions: any[];
}> {
    try {
        console.log("💾 [Database] Starting save operation for custom mock...");

        const { examData, passagesData, questionsData } = params;

        // 1. Save Exam Paper
        const { data: examResponse, error: examError } = await supabase
            .from("exam_papers")
            .insert([examData])
            .select();

        if (examError) throw new Error(`Exam Insert: ${examError.message}`);
        console.log("📄 [DB Save] Exam Paper metadata saved");

        const examId = examResponse[0].id;

        // 2. Save Passages
        const { data: passagesResponse, error: passagesError } = await supabase
            .from("passages")
            .insert(passagesData)
            .select();

        if (passagesError) throw new Error(`Passages Insert: ${passagesError.message}`);
        console.log(`📄 [DB Save] ${passagesData.length} Passage(s) saved`);

        // 3. Save Questions
        const { data: questionsResponse, error: questionsError } = await supabase
            .from("questions")
            .insert(questionsData)
            .select();

        if (questionsError) throw new Error(`Questions Insert: ${questionsError.message}`);
        console.log(`✅ [DB Save] ${questionsData.length} Questions saved`);

        // 4. Update genre usage counts
        await updateGenreUsageCount(passagesData);

        console.log("✅ [DB Save] All data persisted successfully");

        return {
            exam: examResponse,
            passages: passagesResponse,
            questions: questionsResponse
        };

    } catch (error) {
        console.error(
            `❌ [DB Save Failed]:`,
            error instanceof Error ? error.message : String(error)
        );
        throw error;
    }
}

/**
 * Updates genre usage counts after custom mock creation.
 */
async function updateGenreUsageCount(passages: Passage[]): Promise<void> {
    try {
        // Get unique genres
        const uniqueGenres = [...new Set(passages.map(p => p.genre))];

        for (const genreName of uniqueGenres) {
            // Get current genre data
            const { data: genreData, error: fetchError } = await supabase
                .from('genres')
                .select('*')
                .eq('name', genreName)
                .single();

            if (fetchError || !genreData) {
                console.warn(`⚠️ [Genre Update] Could not find genre: ${genreName}`);
                continue;
            }

            // Update custom_exam_usage_count
            const { error: updateError } = await supabase
                .from('genres')
                .update({
                    custom_exam_usage_count: (genreData.custom_exam_usage_count || 0) + 1,
                    total_usage_count: (genreData.daily_usage_count || 0) + (genreData.custom_exam_usage_count || 0) + 1,
                    last_used_custom_exam_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', genreData.id);

            if (updateError) {
                console.warn(`⚠️ [Genre Update] Could not update genre: ${genreName}`, updateError.message);
            } else {
                console.log(`✅ [Genre Update] Updated usage count for: ${genreName}`);
            }
        }
    } catch (error) {
        console.error("❌ [Genre Update] Error updating genre counts:", error);
        // Non-critical, don't throw
    }
}
