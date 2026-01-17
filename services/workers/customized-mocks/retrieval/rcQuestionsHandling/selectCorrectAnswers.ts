import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const AnswerSchema = z.object({
    answers: z.array(z.object({
        question_id: z.string(),
        correct_answer: z.string(), // "A", "B", "C", or "D"
    })),
});

/**
 * Selects correct answers for RC questions.
 */
export async function selectCorrectAnswers(params: {
    passageText: string;
    questions: Question[];
}): Promise<Question[]> {
    const { passageText, questions } = params;

    console.log(`✅ [RC Answers] Selecting correct answers for ${questions.length} questions`);

    const prompt = `You are a CAT VARC examiner. Select the correct answer for each question.

PASSAGE:
${passageText}

QUESTIONS:
${questions.map((q, i) => `
Q${i + 1}: ${q.question_text}
A) ${q.options.A}
B) ${q.options.B}
C) ${q.options.C}
D) ${q.options.D}
`).join("\n")}

For each question, select the single best answer (A, B, C, or D).

Return JSON:
{
  "answers": [
    { "question_id": "...", "correct_answer": "A|B|C|D" }
  ]
}
`;

    console.log("⏳ [RC Answers] Waiting for LLM response");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content: "You are a CAT VARC examiner. Select correct answers based on passage text.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(AnswerSchema, "rc_answers"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
        throw new Error("Failed to select RC answers");
    }

    // Merge answers into questions
    const answerMap = new Map(parsed.answers.map(a => [a.question_id, a.correct_answer]));

    const questionsWithAnswers = questions.map(q => ({
        ...q,
        correct_answer: { answer: answerMap.get(q.id) || "" },
    }));

    console.log(`✅ [RC Answers] Selected answers for all questions`);
    return questionsWithAnswers;
}
