// =============================================================================
// Daily Content Worker - Fetch Questions Data
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { questions } from "../../../db/schema";
import { inArray, or } from "drizzle-orm";

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

    if (questionsIds.length === 0 && passageIds.length === 0) {
        console.log("✅ [Questions] No IDs provided, returning empty array");
        return [];
    }

    // Build the where clause
    const conditions = [];
    if (questionsIds.length > 0) {
        conditions.push(inArray(questions.id, questionsIds));
    }
    if (passageIds.length > 0) {
        conditions.push(inArray(questions.passageId, passageIds));
    }

    const data = await db.query.questions.findMany({
        where: conditions.length > 1 ? or(...conditions) : conditions[0],
    });

    console.log(`✅ [Questions] Loaded ${data?.length || 0} records`);

    // Map to Domain Type (snake_case)
    return data.map((q) => {
        let parsedOptions = q.options;
        if (typeof q.options === 'string') {
            try { parsedOptions = JSON.parse(q.options); } catch (e) { console.error("Failed to parse options", e); }
        }

        let parsedJumbled = q.jumbledSentences;
        if (typeof q.jumbledSentences === 'string') {
            try { parsedJumbled = JSON.parse(q.jumbledSentences); } catch (e) { console.error("Failed to parse jumbledSentences", e); }
        }

        let parsedCorrectAnswer = { answer: "" };
        if (typeof q.correctAnswer === 'string') {
            try {
                // Check if it's a JSON string or just the answer string
                if (q.correctAnswer.trim().startsWith('{')) {
                    parsedCorrectAnswer = JSON.parse(q.correctAnswer);
                } else {
                    parsedCorrectAnswer = { answer: q.correctAnswer };
                }
            } catch (e) {
                console.error("Failed to parse correctAnswer", e);
                parsedCorrectAnswer = { answer: q.correctAnswer };
            }
        }
        // Handle explicit object case if drizzle already parsed it (unlikely with 'text' type but possible if schema changed)
        else if (typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
            parsedCorrectAnswer = q.correctAnswer as any;
        }

        return {
            id: q.id,
            passage_id: q.passageId,
            paper_id: q.paperId,
            question_text: q.questionText,
            question_type: q.questionType as any,
            options: parsedOptions as any,
            jumbled_sentences: parsedJumbled as any,
            correct_answer: parsedCorrectAnswer,
            rationale: q.rationale,
            difficulty: (q.difficulty as "easy" | "medium" | "hard" | "expert") || "medium",
            tags: q.tags || [],
            created_at: q.createdAt?.toISOString() || new Date().toISOString(),
            updated_at: q.updatedAt?.toISOString() || new Date().toISOString(),
        };
    });
}
