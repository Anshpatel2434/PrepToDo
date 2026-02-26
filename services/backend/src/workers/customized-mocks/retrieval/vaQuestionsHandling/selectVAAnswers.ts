import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question } from "../../schemas/types";
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('va-answers-selector');
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface SelectVAAnswersParams {
    questions: Question[];
}

// 1. Updated Schema to include 'type' as requested in the prompt
const AnswerSelectionSchema = z.object({
    questions: z.array(
        z.object({
            id: z.string(), // Removed .uuid() to be more flexible with string matching
            type: z.string(),
            correct_answer: z.object({
                answer: z.string()
            })
        })
    ),
});

export async function selectVAAnswers(params: SelectVAAnswersParams) {
    try {
        const { questions } = params;

        if (questions.length === 0) return [];

        logger.info(`✅ [VA Answers] Selecting correct answers for ${questions.length} questions`);

        // 2. Updated Prompt: Added explicit instruction to return the EXACT ID provided
        const prompt = `SYSTEM:
You are a CAT VARC expert with 20+ years of experience.
You identify the correct answer for each question with high accuracy.

CRITICAL RULES:
- Choose the best answer based on CAT standards
- For para_summary: choose the most accurate summary (Option A, B, C, or D)
- For para_completion: choose the logical completion (Option A, B, C, or D)
- For para_jumble: identify the 4-digit sequence (e.g., 2413)
- For odd_one_out: identify the single odd sentence number (e.g., 3)

---

USER:
Identify the correct answer for these ${questions.length} VA questions. 
IMPORTANT: You MUST return the EXACT "id" provided for each question.

${questions.map((q, i) => `
---
QUESTION ${i + 1}:
ID: ${q.id}
Type: ${q.question_type}

${q.question_text}

${(q.question_type === "para_jumble" || q.question_type === "odd_one_out")
                ? `Sentences:
${JSON.stringify(q.jumbled_sentences || q.options, null, 2)}`
                : `Options: 
${Object.entries(q.options || {}).map(([key, value]) => `${key}) ${value}`).join("\n")}`
            }
`).join("\n")}

---

## OUTPUT FORMAT
Return STRICT JSON only. 
{
  "questions": [
    {
      "id": "EXACT_ID_FROM_INPUT",
      "type": "question_type",
      "correct_answer": { "answer": "formatted_answer" }
    }
  ]
}

### DATA FORMATTING RULES:
1. para_summary & para_completion: Return the letter (A, B, C, or D).
2. para_jumble: Return the numeric sequence (e.g., "4312").
3. odd_one_out: Return the single digit (e.g., "5").
`;

        logger.info("⏳ [VA Answers] Waiting for LLM to select answers");

        const completion = await client.chat.completions.parse({
            model: MODEL,
            temperature: 0, // Lowered to 0 for maximum deterministic accuracy
            messages: [
                { role: "system", content: "You are a CAT VARC expert. You return the exact IDs provided in the user prompt." },
                { role: "user", content: prompt },
            ],
            response_format: zodResponseFormat(AnswerSelectionSchema, "va_answers"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed) {
            throw new Error("Failed to parse LLM response");
        }

        // 3. Robust Mapping
        const questionsWithAnswers = questions.map(originalQ => {
            // Find answer by ID (trimming in case of whitespace hallucinations)
            const answerData = parsed.questions.find(a => a.id.trim() === originalQ.id.trim());

            if (!answerData) {
                logger.error({ questionId: originalQ.id, receivedIds: parsed.questions.map(pq => pq.id) }, `Missing ID in LLM response`);
                throw new Error(`Missing answer data for question ${originalQ.id}`);
            }

            return {
                ...originalQ,
                correct_answer: {
                    answer: (() => {
                        const raw = answerData.correct_answer.answer.trim();
                        if (originalQ.question_type === 'para_completion' || originalQ.question_type === 'para_summary') {
                            const numToLetter: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
                            if (numToLetter[raw]) return numToLetter[raw];
                        }
                        return raw;
                    })()
                },
            };
        });

        logger.info(`✅ [VA Answers] Successfully matched ${questionsWithAnswers.length} questions`);
        return questionsWithAnswers;

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Error in selectVAAnswers");
        throw error;
    }
}