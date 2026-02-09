import { db } from "../../../db";
import { examPapers, passages, questions, genres } from "../../../db/schema";
import { Exam, Passage, Question } from "../schemas/types";
import { eq, sql } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('custom-mock-db-save');

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
        logger.info("💾 [Database] Starting save operation for custom mock...");

        const { examData, passagesData, questionsData } = params;

        // 1. Save or Update Exam Paper
        const [examResponse] = await db
            .insert(examPapers)
            .values({
                id: examData.id,
                name: examData.name,
                year: examData.year,
                exam_type: examData.exam_type || 'CAT',
                slot: examData.slot,
                is_official: examData.is_official,
                used_articles_id: examData.used_articles_id || [],
                generated_by_user_id: examData.generated_by_user_id,
                time_limit_minutes: examData.time_limit_minutes,
                generation_status: 'completed',
                created_at: new Date(),
                updated_at: new Date(),
            })
            .onConflictDoUpdate({
                target: examPapers.id,
                set: {
                    name: examData.name,
                    year: examData.year,
                    exam_type: examData.exam_type || 'CAT',
                    slot: examData.slot,
                    is_official: examData.is_official,
                    used_articles_id: examData.used_articles_id || [],
                    time_limit_minutes: examData.time_limit_minutes,
                    generation_status: 'completed',
                    updated_at: new Date(),
                }
            })
            .returning();

        logger.info("📄 [DB Save] Exam Paper metadata saved");

        // 2. Save Passages
        let passagesResponse: any[] = [];
        if (passagesData.length > 0) {
            passagesResponse = await db
                .insert(passages)
                .values(passagesData.map(p => ({
                    id: p.id,
                    title: p.title,
                    content: p.content,
                    word_count: p.word_count,
                    genre: p.genre,
                    difficulty: p.difficulty,
                    source: p.source,
                    paper_id: p.paper_id,
                    is_daily_pick: p.is_daily_pick,
                    is_featured: p.is_featured,
                    is_archived: p.is_archived,
                    created_at: new Date(),
                    updated_at: new Date(),
                })))
                .returning();
            logger.info(`📄 [DB Save] ${passagesData.length} Passage(s) saved`);
        }

        // 3. Save Questions
        let questionsResponse: any[] = [];
        if (questionsData.length > 0) {
            questionsResponse = await db
                .insert(questions)
                .values(questionsData.map(q => ({
                    id: q.id,
                    passage_id: q.passage_id,
                    paper_id: q.paper_id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: JSON.stringify(q.options),
                    jumbled_sentences: q.jumbled_sentences ? JSON.stringify(q.jumbled_sentences) : null,
                    correct_answer: JSON.stringify(q.correct_answer),
                    rationale: q.rationale,
                    difficulty: q.difficulty,
                    tags: q.tags || [],
                    created_at: new Date(),
                    updated_at: new Date(),
                })))
                .returning();
            logger.info(`✅ [DB Save] ${questionsData.length} Questions saved`);
        }

        // 4. Update genre usage counts
        await updateGenreUsageCount(passagesData);

        logger.info("✅ [DB Save] All data persisted successfully");

        return {
            exam: examResponse,
            passages: passagesResponse,
            questions: questionsResponse
        };

    } catch (error) {
        logger.error(
            { error: error instanceof Error ? error.message : String(error) },
            `❌ [DB Save Failed]`
        );
        throw error;
    }
}

/**
 * Updates genre usage counts after custom mock creation.
 */
async function updateGenreUsageCount(passagesData: Passage[]): Promise<void> {
    try {
        // Get unique genres
        const uniqueGenres = Array.from(new Set(passagesData.map(p => p.genre)));

        for (const genreName of uniqueGenres) {
            // Check if genre exists and update
            const [existingGenre] = await db
                .select()
                .from(genres)
                .where(eq(genres.name, genreName));

            if (existingGenre) {
                await db.update(genres)
                    .set({
                        custom_exam_usage_count: (existingGenre.custom_exam_usage_count || 0) + 1,
                        last_used_custom_exam_at: new Date(),
                        updated_at: new Date()
                    })
                    .where(eq(genres.id, existingGenre.id));
                logger.info(`✅ [Genre Update] Updated usage count for: ${genreName}`);
            } else {
                logger.warn(`⚠️ [Genre Update] Could not find genre: ${genreName}`);
            }
        }
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [Genre Update] Error updating genre counts");
        // Non-critical, don't throw
    }
}
