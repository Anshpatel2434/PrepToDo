// =============================================================================
// Daily Content Worker - Fetch Questions Data
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { questions } from "../../../db/schema";
import { inArray, or } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('questions-fetcher');

/**
 * Fetches questions by their IDs or by passage IDs.
 * This allows fetching both specific questions and all questions from specific passages.
 * @param questionsIds - Array of question IDs to fetch directly
 * @param passageIds - Array of passage IDs to fetch all associated questions
 */
export async function fetchQuestionsData(questionsIds: string[], passageIds: string[]) {
    logger.info(
        `❓ [Questions] Fetching questions from DB (questionIds=${questionsIds.length}, passageIds=${passageIds.length})`
    );

    if (questionsIds.length === 0 && passageIds.length === 0) {
        logger.info("✅ [Questions] No IDs provided, returning empty array");
        return [];
    }

    // Build the where clause
    const conditions = [];
    if (questionsIds.length > 0) {
        conditions.push(inArray(questions.id, questionsIds));
    }
    if (passageIds.length > 0) {
        conditions.push(inArray(questions.passage_id, passageIds));
    }

    const data = await db.query.questions.findMany({
        where: conditions.length > 1 ? or(...conditions) : conditions[0],
    });

    logger.info(`✅ [Questions] Loaded ${data?.length || 0} records`);

    // Map to Domain Type (snake_case)
    return data.map((q) => {
        let parsedOptions = q.options;
        if (typeof q.options === 'string') {
            try { parsedOptions = JSON.parse(q.options); } catch (e) { logger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to parse options"); }
        }

        let parsedJumbled = q.jumbled_sentences;
        if (typeof q.jumbled_sentences === 'string') {
            try { parsedJumbled = JSON.parse(q.jumbled_sentences); } catch (e) { logger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to parse jumbledSentences"); }
        }

        let parsedCorrectAnswer = { answer: "" };
        if (typeof q.correct_answer === 'string') {
            try {
                // Check if it's a JSON string or just the answer string
                if (q.correct_answer.trim().startsWith('{')) {
                    parsedCorrectAnswer = JSON.parse(q.correct_answer);
                } else {
                    parsedCorrectAnswer = { answer: q.correct_answer };
                }
            } catch (e) {
                logger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to parse correctAnswer");
                parsedCorrectAnswer = { answer: q.correct_answer };
            }
        }
        // Handle explicit object case if drizzle already parsed it (unlikely with 'text' type but possible if schema changed)
        else if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
            parsedCorrectAnswer = q.correct_answer as any;
        }

        return {
            id: q.id,
            passage_id: q.passage_id,
            paper_id: q.paper_id,
            question_text: q.question_text,
            question_type: q.question_type as any,
            options: parsedOptions as any,
            jumbled_sentences: parsedJumbled as any,
            correct_answer: parsedCorrectAnswer,
            rationale: q.rationale,
            difficulty: (q.difficulty as "easy" | "medium" | "hard" | "expert") || "medium",
            tags: q.tags || [],
            created_at: q.created_at?.toISOString() || new Date().toISOString(),
            updated_at: q.updated_at?.toISOString() || new Date().toISOString(),
        };
    });
}
