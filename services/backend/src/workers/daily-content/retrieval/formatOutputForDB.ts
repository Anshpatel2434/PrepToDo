// formatOutputForDB.ts
import { DataManager } from "./dataManager";
import { Exam, Passage, Question } from "../schemas/types";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Simplified formatter that works with DataManager
 * No ID generation - just formats data that's already been created
 */
export function formatOutputForDB(
    dataManager: DataManager,
    genreData: any
): {
    exam: Exam;
    passage: Passage;
    questions: Question[];
    genreData: any;
} {
    try {
        // Get all data from DataManager (IDs already assigned)
        const exam = dataManager.getExamForDB();
        const passage = dataManager.getPassageForDB();
        const questions = dataManager.getQuestionsForDB();

        const stats = dataManager.getStats();

        logger.info(
            { exam: exam.name, year: exam.year, wordCount: passage.word_count, genre: passage.genre, totalQuestions: stats.totalQuestions, rcQuestions: stats.rcQuestions, vaQuestions: stats.vaQuestions },
            "✅ [Output Formatter] Formatted data for DB upload"
        );

        return {
            exam,
            passage,
            questions,
            genreData,
        };
    } catch (error) {
        logger.error(
            { error },
            "❌ [Output Formatter] Error formatting output"
        );
        throw error;
    }
}

/**
 * Validates output data against schemas before upload
 */
export function validateOutputForDB(data: {
    exam: Exam;
    passage: Passage;
    questions: Question[];
}): boolean {
    try {
        const { exam, passage, questions } = data;

        // Basic validation
        if (!exam.id || !exam.name) {
            logger.error("❌ [Output Formatter] Invalid exam data");
            return false;
        }

        if (!passage.id || !passage.content || passage.word_count < 100) {
            logger.error("❌ [Output Formatter] Invalid passage data");
            return false;
        }

        if (questions.length === 0) {
            logger.error("❌ [Output Formatter] No questions to upload");
            return false;
        }

        // Validate question types
        const validQuestionTypes = [
            "rc_question",
            "true_false",
            "inference",
            "tone",
            "purpose",
            "detail",
            "para_jumble",
            "para_summary",
            "para_completion",
            "critical_reasoning",
            "vocab_in_context",
            "odd_one_out",
        ];

        for (const q of questions) {
            if (!q.id || !q.question_text || !q.question_type) {
                logger.error({ questionId: q.id }, "❌ [Output Formatter] Invalid question data");
                return false;
            }

            if (!validQuestionTypes.includes(q.question_type)) {
                logger.error({ questionType: q.question_type }, "❌ [Output Formatter] Invalid question type");
                return false;
            }

            // For para_jumble and odd_one_out, jumbled_sentences should be populated
            if (q.question_type === "para_jumble" || q.question_type === "odd_one_out") {
                if (!q.jumbled_sentences || Object.keys(q.jumbled_sentences).length === 0) {
                    logger.error({ questionType: q.question_type }, "❌ [Output Formatter] Missing jumbled_sentences");
                    return false;
                }
            }

            // For other question types, options should be populated
            if (q.question_type !== "para_jumble" && q.question_type !== "odd_one_out") {
                if (!q.options || Object.keys(q.options).length === 0) {
                    logger.error({ questionType: q.question_type }, "❌ [Output Formatter] Missing options");
                    return false;
                }
            }
        }

        logger.info("✅ [Output Formatter] All data validated successfully");
        return true;
    } catch (error) {
        logger.error(
            { error },
            "❌ [Output Formatter] Error validating output"
        );
        return false;
    }
}

/**
 * Generates summary report of the output data
 */
export function generateOutputReport(data: {
    exam: Exam;
    passage: Passage;
    questions: Question[];
}): string {
    const { exam, passage, questions } = data;

    // Count questions by type
    const questionCounts = questions.reduce((acc, q) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const rcCount = questions.filter(q => q.question_type === "rc_question").length;
    const vaCount = questions.filter(q => ["para_summary", "para_completion", "para_jumble", "odd_one_out"].includes(q.question_type)).length;

    return `
╔══════════════════════════════════════════════════════════════════╗
║                    DAILY CONTENT OUTPUT REPORT                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📋 EXAM INFO                                                   ║
║     Name: ${exam.name.padEnd(40)} ║
║     Year: ${exam.year.toString().padEnd(44)} ║
║     Type: ${exam.exam_type.padEnd(44)} ║
║                                                                ║
║  📄 PASSAGE INFO                                                ║
║     ID: ${passage.id.substring(0, 30)}... ║
║     Words: ${passage.word_count.toString().padEnd(43)} ║
║     Genre: ${passage.genre.padEnd(43)} ║
║     Difficulty: ${passage.difficulty.padEnd(38)} ║
║                                                                ║
║  ❓ QUESTIONS BREAKDOWN                                         ║
║     Total: ${questions.length.toString().padEnd(46)} ║
║     RC Questions: ${rcCount.toString().padEnd(42)} ║
║     VA Questions: ${vaCount.toString().padEnd(42)} ║
║                                                                ║
║  📊 BY QUESTION TYPE                                            ║${Object.entries(questionCounts).map(([type, count]) => `
║     ${type.padEnd(24)} ${count.toString().padEnd(32)} ║`).join('')}
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝
`;
}
