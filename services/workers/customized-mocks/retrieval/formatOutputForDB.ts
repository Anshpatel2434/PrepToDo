// formatOutputForDB.ts
import { Article, Exam, Passage, Question } from "../../schemas/types";
import { v4 as uuidv4 } from 'uuid';

interface FormatOutputParams {
    passagesData: Array<{ passageData: any; articleData: Article }>;
    rcQuestions: Question[];
    vaQuestions: Question[];
    userId: string;
    mockName: string;
    timeLimitMinutes?: number;
}

/**
 * Formats output for database upload for custom mock.
 * Returns 3 data sets: Exam, Passages, Questions
 */
export function formatOutputForDB(params: FormatOutputParams): {
    exam: Exam;
    passages: Passage[];
    questions: Question[];
} {
    try {
        const { passagesData, rcQuestions, vaQuestions, userId, mockName, timeLimitMinutes } = params;
        const now = new Date().toISOString();
        const currentYear = new Date().getFullYear();

        // Collect all article IDs
        const articleIds = passagesData.map(p => p.articleData.id);

        // 1. Create Exam data
        const exam: Exam = {
            id: uuidv4(),
            name: mockName || "Custom Mock Test",
            year: currentYear,
            exam_type: "CAT",
            slot: null,
            is_official: false,
            created_at: now,
            used_articles_id: articleIds,
            generate_by_user_id: userId,
        };

        // 2. Create Passage data for each passage
        const passages: Passage[] = passagesData.map((pd, index) => {
            const passageData = pd.passageData;
            const articleData = pd.articleData;

            return {
                id: passageData.id,
                title: `Passage ${index + 1}`,
                content: passageData.content,
                word_count: passageData.word_count,
                genre: articleData.genre,
                difficulty: passageData.difficulty,
                source: articleData.source_name,
                paper_id: exam.id, // Link passage to exam
                is_daily_pick: false,
                is_featured: false,
                is_archived: false,
                created_at: now,
                updated_at: now,
            };
        });

        // 3. Process all questions
        const allQuestions: Question[] = [];

        // Add RC questions (link to respective passages)
        let rcIndex = 0;
        for (let i = 0; i < rcQuestions.length; i++) {
            const q = rcQuestions[i];
            const passageIndex = i % passages.length; // Distribute RC questions across passages
            const passage = passages[passageIndex];

            allQuestions.push({
                ...q,
                id: uuidv4(),
                passage_id: passage.id,
                paper_id: exam.id
            });
            rcIndex++;
        }

        // Add VA questions (no passage, different question types)
        const vaQuestionsNoPassage = vaQuestions.map(q => ({
            ...q,
            id: uuidv4(),
            passage_id: null,
            paper_id: exam.id
        }));
        allQuestions.push(...vaQuestionsNoPassage);

        console.log(`✅ [Output Formatter] Created data for DB upload`);
        console.log(`   - Exam: ${exam.name} (${currentYear})`);
        console.log(`   - Passages: ${passages.length}`);
        console.log(`   - Questions: ${allQuestions.length} total (RC: ${rcQuestions.length}, VA: ${vaQuestions.length})`);
        console.log(`   - User: ${userId}`);
        if (timeLimitMinutes) {
            console.log(`   - Time Limit: ${timeLimitMinutes} minutes`);
        }

        return {
            exam,
            passages,
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
║     User ID: ${exam.generate_by_user_id?.substring(0, 36)}... ║
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
╚══════════════════════════════════════════════════════════════════╝
`;
}
