// selectVAAnswers.ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface SelectVAAnswersParams {
    questions: Question[];
}

const AnswerSelectionSchema = z.object({
    questions: z.array(
        z.object({
            id: z.string().uuid(),
            correct_answer: z.object({
                answer: z.string()
            })
        })
    ),
});

/**
 * Selects correct answers for VA questions (para_summary, para_completion, para_jumble, odd_one_out)
 */
export async function selectVAAnswers(params: SelectVAAnswersParams) {
    try {
        const { questions } = params;

        console.log(`✅ [VA Answers] Selecting correct answers for ${questions.length} questions`);

        const prompt = `SYSTEM:
You are a CAT VARC expert with 20+ years of experience.
You identify the correct answer for each question with high accuracy.

CRITICAL RULES:
- Choose the best answer based on CAT standards
- For para_summary: choose the most accurate and comprehensive summary
- For para_completion: choose the option that logically completes the paragraph
- For para_jumble: choose the ordering that creates the most coherent flow
- For odd_one_out: identify the option that differs from the others in a meaningful way

---

USER:
You are given ${questions.length} VA questions. For each question, identify the correct answer.

${questions.map((q, i) => `

---

QUESTION ${i + 1}:
Type: ${q.question_type}

${q.question_text}

${q.question_type === "para_jumble"
    ? `Jumbled Sentences:
${JSON.stringify(q.jumbled_sentences, null, 2)}

Options:
${Object.entries(q.options).map(([key, value]) => `${key}) ${value}`).join("\n")}`
    : `Options:
${Object.entries(q.options).map(([key, value]) => `${key}) ${value}`).join("\n")}`
}

Identify the correct answer (A, B, C, or D).
`).join("\n")}

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<question_id>",
      "correct_answer": { "answer": "A|B|C|D" }
    },
    ...
  ]
}

IMPORTANT:
- Answer must be exactly "A", "B", "C", or "D"
- No additional text or commentary
`;

        console.log("⏳ [VA Answers] Waiting for LLM to select answers");

        const completion = await client.chat.completions.parse({
            model: MODEL,
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC expert. You identify correct answers with high accuracy.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(AnswerSelectionSchema, "va_answers"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed || parsed.questions.length !== questions.length) {
            throw new Error("Invalid VA answer selection output");
        }

        // Map the correct answers back to the questions
        const questionsWithAnswers = questions.map(q => {
            const answerData = parsed.questions.find(a => a.id === q.id);
            if (!answerData) {
                throw new Error(`Missing answer data for question ${q.id}`);
            }
            return {
                ...q,
                correct_answer: answerData.correct_answer,
            };
        });

        console.log(`✅ [VA Answers] Selected answers for ${questionsWithAnswers.length} questions`);

        return questionsWithAnswers;
    } catch (error) {
        console.error("❌ [VA Questions] Error selecting answers:", error);
        throw error;
    }
}
