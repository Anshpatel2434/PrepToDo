import { db } from "../../../db/index.js";
import { examPapers, passages, questions } from "../../../db/schema.js";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Saves article metadata into the database
 */
export async function saveAllDataToDB({ examData, passageData, questionsData }: any) {
    try {
        logger.info("💾 [Database] Starting save operation");

        // 1. Save Exam Paper
        const examResponse = await db
            .insert(examPapers)
            .values([examData])
            .returning();

        if (!examResponse || examResponse.length === 0) {
            throw new Error("Exam Insert: No response returned");
        }
        logger.info("📄 [DB Save] Exam Paper metadata saved");

        // 2. Save Passage
        const passageResponse = await db
            .insert(passages)
            .values([passageData])
            .returning();

        if (!passageResponse || passageResponse.length === 0) {
            throw new Error("Passage Insert: No response returned");
        }
        logger.info("📄 [DB Save] Passage content saved");

        // 3. Save Questions
        const questionsResponse = await db
            .insert(questions)
            .values(questionsData)
            .returning();

        if (!questionsResponse || questionsResponse.length === 0) {
            throw new Error("Questions Insert: No response returned");
        }
        logger.info("✅ [DB Save] All data persisted successfully");

        return {
            exam: examResponse,
            passage: passageResponse,
            questions: questionsResponse
        };

    } catch (error) {
        logger.error(
            { error },
            "❌ [DB Save Failed]"
        );
        // Re-throw the error so the calling function can catch it
        throw error;
    }
}