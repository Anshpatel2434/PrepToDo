import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Selects the correct answer for each question using the passage.
 *
 * This is a deterministic pass with temperature=0 to ensure consistency.
 * The LLM acts as a strict answer key verifier, not an explainer.
 *
 * Key aspects:
 * - Low temperature (0.0) for consistent results
 * - No explanations or justifications required
 * - Only selects the correct option letter (A/B/C/D)
 * - Handles ambiguous questions by choosing the best alignment with author's intent
 */

/* =========================================
   Schema: Only what we expect back
   ========================================= */

const CorrectAnswerSchema = z.object({
    id: z.string().uuid(),
    correct_answer: z.enum(["A", "B", "C", "D"]),
});

const ResponseSchema = z.object({
    questionsWithAnswer : z.array(CorrectAnswerSchema)
})

/* =========================================
   Pass-2 Function
   ========================================= */

export async function selectCorrectAnswers(params: {
    passageText: string;
    questions: any[]; // already schema-valid Question objects
}) {
    const { passageText, questions } = params;

    console.log(`🧠 [Answer Key] Selecting correct answers for ${questions.length} questions`);

    const prompt = `SYSTEM:
You are a strict CAT answer key verifier.
You select the correct option.
You do NOT explain.
You do NOT justify.
You do NOT rewrite.

USER:
Determine the correct answer for each question below
based ONLY on the passage.

STRICT RULES:
- Exactly ONE option must be correct per question
- Do NOT modify question text
- Do NOT modify options
- Do NOT add explanations
- If a question is ambiguous, choose the option
  that best aligns with the author’s intent

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
Return STRICT JSON array with objects:

{
  "id": "<question_id>",
  "correct_answer": "A|B|C|D"
}

`;

    console.log("⏳ [Answer Key] Waiting for LLM response (answer key)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.0, // very important
        messages: [
            {
                role: "system",
                content:
                    "You are a CAT answer key verifier. You select answers only.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "answer_key"
        ),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questionsWithAnswer.length !== questions.length) {
        throw new Error("Answer key generation failed or incomplete");
    }

    console.log("✅ [Answer Key] Answer key received");

    /* =========================================
       Merge back into questions
       ========================================= */

    const answerMap = new Map(
        parsed.questionsWithAnswer.map(a => [a.id, a.correct_answer])
    );

    const updatedQuestions = questions.map(q => ({
        ...q,
        correct_answer: answerMap.get(q.id),
        updated_at: new Date().toISOString(),
    }));

    console.log("✅ [Answer Key] Answers merged into question objects");

    return updatedQuestions;
}
