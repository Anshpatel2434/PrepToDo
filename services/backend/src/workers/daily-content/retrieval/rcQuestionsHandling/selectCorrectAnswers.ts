// =============================================================================
// Daily Content Worker - Select Correct Answers
// =============================================================================
// OpenAI-based answer selection - copied with updated imports

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('rc-answers');
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const CorrectAnswerSchema = z.object({
    id: z.string().uuid(),
    correct_answer: z.object({
        answer: z.enum(["A", "B", "C", "D"]),
    }),
});

const ResponseSchema = z.object({
    questionsWithAnswer: z.array(CorrectAnswerSchema)
});

export async function selectCorrectAnswers(params: {
    passageText: string;
    questions: any[];
}) {
    const { passageText, questions } = params;

    logger.info(`🧠 [Answer Key] Selecting correct answers for ${questions.length} questions`);

    const prompt = `SYSTEM:
You are a strict CAT answer key verifier.
You select the correct option.
You do NOT explain.
You do NOT justify.

USER:
Determine the correct answer for each question below
based ONLY on the passage.

STRICT RULES:
- Exactly ONE option must be correct per question
- Do NOT modify question text
- Do NOT modify options
- Do NOT add explanations

--------------------------------
PASSAGE
--------------------------------
${passageText}

--------------------------------
QUESTIONS
--------------------------------
${JSON.stringify(
        questions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
        })),
        null,
        2
    )}

--------------------------------
OUTPUT FORMAT
--------------------------------
Return STRICT JSON:
{
  "questionsWithAnswer": [
    {
      "id": "<question_id>",
      "correct_answer": { "answer": "A|B|C|D" }
    }
  ]
}
`;

    logger.info("⏳ [Answer Key] Waiting for LLM response (answer key)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.0,
        messages: [
            {
                role: "system",
                content: "You are a CAT answer key verifier. You select answers only.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(ResponseSchema, "answer_key"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questionsWithAnswer.length !== questions.length) {
        throw new Error("Answer key generation failed or incomplete");
    }

    logger.info("✅ [Answer Key] Answer key received");

    const answerMap = new Map(
        parsed.questionsWithAnswer.map(a => [a.id, a.correct_answer])
    );

    const updatedQuestions = questions.map(q => ({
        ...q,
        correct_answer: answerMap.get(q.id),
        updated_at: new Date().toISOString(),
    }));

    logger.info("✅ [Answer Key] Answers merged into question objects");

    return updatedQuestions;
}
