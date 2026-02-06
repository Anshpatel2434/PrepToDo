// formatOutputForDB.ts
import { DataManager } from "./dataManager";
import { Exam, Passage, Question } from "../schemas/types";

/**
 * Simplified formatter that works with DataManager
 * No ID generation - just formats data that's already been created
 */
export function formatOutputForDB(
    dataManager: DataManager,
    params: {
        userId: string;
        mockName: string;
        timeLimitMinutes?: number;
    }
): {
    exam: Exam;
    passages: Passage[];
    questions: Question[];
} {
    try {
        const { userId, mockName, timeLimitMinutes } = params;

        // Get all data from DataManager (IDs already assigned)
        const exam = dataManager.getExamForDB({
            mockName,
            userId,
            timeLimitMinutes,
        });

        const passages = dataManager.getPassagesForDB(mockName);
        const questions = dataManager.getQuestionsForDB();

        const stats = dataManager.getStats();

        console.log(`✅ [Output Formatter] Formatted data for DB upload`);
        console.log(`   - Exam: ${exam.name} (${exam.year})`);
        console.log(`   - Passages: ${stats.passageCount}`);
        console.log(`   - Questions: ${stats.totalQuestions} total (RC: ${stats.rcQuestions}, VA: ${stats.vaQuestions})`);
        console.log(`   - User: ${userId}`);
        if (timeLimitMinutes) {
            console.log(`   - Time Limit: ${timeLimitMinutes} minutes`);
        }

        return {
            exam,
            passages,
            questions,
        };
    } catch (error) {
        console.error("❌ [Output Formatter] Error formatting output:", error);
        throw error;
    }
}

/**
 * Validates output data against schemas before upload
 */
export function validateOutputForDB(data: {
    exam: Exam;
    passages: Passage[];
    questions: Question[];
}): boolean {
    try {
        const { exam, passages, questions } = data;

        // Basic validation
        if (!exam.id || !exam.name) {
            console.error("❌ [Output Formatter] Invalid exam data");
            return false;
        }

        if (passages.length === 0) {
            console.error("❌ [Output Formatter] No passages to upload");
            return false;
        }

        for (const p of passages) {
            if (!p.id || !p.content || p.word_count < 100) {
                console.error(`❌ [Output Formatter] Invalid passage data for ${p.id}`);
                return false;
            }
        }

        if (questions.length === 0) {
            console.error("❌ [Output Formatter] No questions to upload");
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
                console.error(`❌ [Output Formatter] Invalid question data for ${q.id}`);
                return false;
            }

            if (!validQuestionTypes.includes(q.question_type)) {
                console.error(`❌ [Output Formatter] Invalid question type: ${q.question_type}`);
                return false;
            }

            // For para_jumble and odd_one_out, jumbled_sentences should be populated
            if (q.question_type === "para_jumble" || q.question_type === "odd_one_out") {
                if (!q.jumbled_sentences || Object.keys(q.jumbled_sentences).length === 0) {
                    console.error(`❌ [Output Formatter] Missing jumbled_sentences for ${q.question_type}`);
                    return false;
                }
            }

            // For other question types, options should be populated
            if (q.question_type !== "para_jumble" && q.question_type !== "odd_one_out") {
                if (!q.options || Object.keys(q.options).length === 0) {
                    console.error(`❌ [Output Formatter] Missing options for ${q.question_type}`);
                    return false;
                }
            }
        }

        console.log("✅ [Output Formatter] All data validated successfully");
        return true;
    } catch (error) {
        console.error("❌ [Output Formatter] Error validating output:", error);
        return false;
    }
}

/**
 * Generates summary report of output data
 */
export function generateOutputReport(data: {
    exam: Exam;
    passages: Passage[];
    questions: Question[];
}): string {
    const { exam, passages, questions } = data;

    // Count questions by type
    const questionCounts = questions.reduce((acc, q) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const rcCount = questions.filter(q => q.question_type === "rc_question").length;
    const vaCount = questions.filter(q => ["para_summary", "para_completion", "para_jumble", "odd_one_out"].includes(q.question_type)).length;

    const totalWords = passages.reduce((sum, p) => sum + p.word_count, 0);

    return `
╔══════════════════════════════════════════════════════════════════╗
║                   CUSTOMIZED MOCK OUTPUT REPORT                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📋 EXAM INFO                                                     ║
║     Name: ${exam.name.padEnd(50)} ║
║     Year: ${exam.year.toString().padEnd(54)} ║
║     Type: ${exam.exam_type.padEnd(54)} ║
║     User ID: ${exam.generated_by_user_id?.substring(0, 36)}... ║
║                                                                  ║
║  📄 PASSAGE INFO                                                  ║
║     Count: ${passages.length.toString().padEnd(52)} ║
║     Total Words: ${totalWords.toString().padEnd(49)} ║
║     Genres: ${passages.map(p => p.genre).join(", ").substring(0, 43)}... ║
║                                                                  ║
║  ❓ QUESTIONS BREAKDOWN                                           ║
║     Total: ${questions.length.toString().padEnd(53)} ║
║     RC Questions: ${rcCount.toString().padEnd(49)} ║
║     VA Questions: ${vaCount.toString().padEnd(49)} ║
║                                                                  ║
║  📊 BY QUESTION TYPE                                             ║${Object.entries(questionCounts).map(([type, count]) => `
║     ${type.padEnd(24)} ${count.toString().padEnd(38)} ║`).join('')}
║                                                                  ║
187: ╚══════════════════════════════════════════════════════════════════╝
`;
}
