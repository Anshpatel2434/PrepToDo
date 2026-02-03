import { db } from "../../../db/index.js";
import { questions } from "../../../db/schema.js";
import { eq, or, inArray } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Fetches questions by their IDs or by passage IDs.
 * This allows fetching both specific questions and all questions from specific passages.
 * @param questionsIds - Array of question IDs to fetch directly
 * @param passageIds - Array of passage IDs to fetch all associated questions
 */
export async function fetchQuestionsData(questionsIds: string[], passageIds: string[]) {
    logger.debug(
        { questionIds: questionsIds.length, passageIds: passageIds.length },
        "❓ [Questions] Fetching questions from DB"
    );

    const data = await db
        .select()
        .from(questions)
        .where(
            or(
                inArray(questions.id, questionsIds),
                inArray(questions.passageId, passageIds)
            )
        );

    logger.info({ count: data?.length }, "✅ [Questions] Loaded records");
    return data;
}