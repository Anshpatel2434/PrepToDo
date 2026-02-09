// =============================================================================
// Daily Content Worker - Save All Data to DB
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { examPapers, passages, questions } from "../../../db/schema";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('db-save');

/**
 * Saves exam, passage, and questions data into the database
 */
export async function saveAllDataToDB({ examData, passageData, questionsData }: {
    examData: any;
    passageData: any;
    questionsData: any[];
}) {
    try {
        logger.info("💾 [Database] Starting save operation...");

        // 1. Save Exam Paper
        const [examResponse] = await db.insert(examPapers).values({
            id: examData.id,
            name: examData.name,
            year: examData.year,
            exam_type: examData.exam_type,
            slot: examData.slot || null,
            is_official: examData.is_official,
            used_articles_id: examData.used_articles_id,
            generated_by_user_id: examData.generated_by_user_id, // Ensure this field exists in examData if required
            generation_status: 'completed',
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();

        logger.info("📄 [DB Save] Exam Paper metadata saved");

        // 2. Save Passage
        const [passageResponse] = await db.insert(passages).values({
            id: passageData.id,
            title: passageData.title,
            content: passageData.content,
            word_count: passageData.word_count,
            genre: passageData.genre,
            difficulty: passageData.difficulty,
            source: passageData.source,
            paper_id: passageData.paper_id,
            is_daily_pick: passageData.is_daily_pick,
            is_featured: passageData.is_featured,
            is_archived: passageData.is_archived,
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();

        logger.info("📄 [DB Save] Passage content saved");

        // 3. Save Questions
        const questionsToInsert = questionsData.map(q => ({
            id: q.id,
            passage_id: q.passage_id || null,
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
        }));

        const questionsResponse = await db.insert(questions).values(questionsToInsert).returning();

        logger.info("✅ [DB Save] All data persisted successfully");

        return {
            exam: examResponse,
            passage: passageResponse,
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
