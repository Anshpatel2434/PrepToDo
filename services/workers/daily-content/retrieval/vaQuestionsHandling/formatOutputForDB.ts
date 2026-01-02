// formatOutputForDB.ts
import { Exam, Passage, Question } from "../../schemas/types";

// Simple UUID generator to avoid additional dependencies
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

interface FormatOutputParams {
    passageData: {
        id: string;
        content: string;
        title: string | null;
        word_count: number;
        genre: string;
        difficulty: "easy" | "medium" | "hard";
        source: string | null;
    };
    rcQuestions: Question[];
    vaQuestions: Question[];
}

/**
 * Formats output for database upload.
 * Returns 3 data sets: Exam, Passage, Questions
 */
export function formatOutputForDB(params: FormatOutputParams): {
    exam: Exam;
    passage: Passage;
    questions: Question[];
} {
    try {
        const { passageData, rcQuestions, vaQuestions } = params;
        const now = new Date().toISOString();
        const currentYear = new Date().getFullYear();

        // 1. Create Exam data
        const exam: Exam = {
            id: generateUUID(),
            name: "Daily Practice",
            year: currentYear,
            exam_type: "CAT",
            slot: null,
            is_official: false,
            created_at: now,
        };

        // 2. Create Passage data
        const passage: Passage = {
            id: passageData.id,
            title: passageData.title,
            content: passageData.content,
            word_count: passageData.word_count,
            genre: passageData.genre,
            difficulty: passageData.difficulty,
            source: passageData.source,
            paper_id: null,
            is_daily_pick: true,
            is_featured: false,
            is_archived: false,
            created_at: now,
            updated_at: now,
        };

        // 3. Process all questions
        const allQuestions: Question[] = [];

        // Add RC questions (tag to passage)
        const rcQuestionsWithPassage = rcQuestions.map(q => ({
            ...q,
            passage_id: passageData.id,
        }));
        allQuestions.push(...rcQuestionsWithPassage);

        // Add VA questions (no passage, different question types)
        const vaQuestionsNoPassage = vaQuestions.map(q => ({
            ...q,
            passage_id: null,
        }));
        allQuestions.push(...vaQuestionsNoPassage);

        console.log(`✅ [Output Formatter] Created data for DB upload`);
        console.log(`   - Exam: ${exam.name} (${currentYear})`);
        console.log(`   - Passage: ${passage.word_count} words, ${passage.genre}`);
        console.log(`   - Questions: ${allQuestions.length} total (RC: ${rcQuestions.length}, VA: ${vaQuestions.length})`);

        return {
            exam,
            passage,
            questions: allQuestions,
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
    passage: Passage;
    questions: Question[];
}): boolean {
    try {
        const { exam, passage, questions } = data;

        // Basic validation
        if (!exam.id || !exam.name) {
            console.error("❌ [Output Formatter] Invalid exam data");
            return false;
        }

        if (!passage.id || !passage.content || passage.word_count < 100) {
            console.error("❌ [Output Formatter] Invalid passage data");
            return false;
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
