// =============================================================================
// Daily Content Worker - Select Correct Answers
// =============================================================================
// OpenAI-based answer selection with answer distribution enforcement

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

/**
 * Shuffles the option positions (A/B/C/D) for a question and updates the correct answer.
 * This provides a code-level guarantee that the correct answer is not biased toward any letter.
 */
function shuffleOptions(question: any): any {
    const options = question.options;
    const correctLetter = question.correct_answer?.answer;

    if (!options || !correctLetter || !options[correctLetter]) {
        return question;
    }

    const letters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    const optionEntries = letters.map(letter => ({
        letter,
        text: options[letter],
        isCorrect: letter === correctLetter,
    }));

    // Fisher-Yates shuffle
    for (let i = optionEntries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionEntries[i], optionEntries[j]] = [optionEntries[j], optionEntries[i]];
    }

    const newOptions: Record<string, string> = {};
    let newCorrectLetter = correctLetter;

    optionEntries.forEach((entry, idx) => {
        const newLetter = letters[idx];
        newOptions[newLetter] = entry.text;
        if (entry.isCorrect) {
            newCorrectLetter = newLetter;
        }
    });

    return {
        ...question,
        options: newOptions,
        correct_answer: { answer: newCorrectLetter },
    };
}

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

⚠️ ANSWER DISTRIBUTION RULE (MANDATORY):
- You MUST distribute correct answers across A, B, C, and D.
- Do NOT assign the same letter to all questions.
- For a set of 4+ questions, each letter (A, B, C, D) should appear at least once.
- For fewer than 4 questions, no letter should be repeated more than once.
- Each question must still be answered on its own merit — do not sacrifice accuracy for distribution.

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
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content: "You are a CAT answer key verifier. You select answers only. Distribute answers across A, B, C, D — avoid repeating the same letter for every question.",
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

    // Post-processing: Shuffle option positions to guarantee no positional bias
    const shuffledQuestions = updatedQuestions.map(q => shuffleOptions(q));

    const answerDist = shuffledQuestions.reduce((acc: Record<string, number>, q: any) => {
        const letter = q.correct_answer?.answer || "?";
        acc[letter] = (acc[letter] || 0) + 1;
        return acc;
    }, {});
    logger.info({ answerDist }, "✅ [Answer Key] Answer distribution after shuffle");

    return shuffledQuestions;
}
