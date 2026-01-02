/**
 * Generates odd_one_out questions
 * This is a separate file to avoid duplication issues
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema, Passage, SemanticIdeas, AuthorialPersona } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

const VAQuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

/**
 * Simple UUID generator to avoid additional dependencies
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generates odd_one_out questions
 */
export async function generateOddOneOutQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}) {
    try {
        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;
        const now = new Date().toISOString();

        console.log(`🧩 [Odd One Out] Starting generation`);

        const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design odd-one-out questions that test understanding of thematic coherence and logical consistency.

CRITICAL MINDSET:
- You are NOT creating simple "find the different category" questions
- You are creating questions that require understanding subtle logical or thematic differences
- The "odd one" should be subtly different, not obviously so

---

USER:
Your task is to generate CAT-style odd-one-out questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `
PASSAGE ${i + 1}:
${rd.passage.content}

QUESTIONS:
${rd.questions.slice(0, 2).map((q, j) => `
Q${j + 1}: ${q.question_text}
Options:
A) ${q.options.A}
B) ${q.options.B}
C) ${q.options.C}
D) ${q.options.D}

Correct: ${q.correct_answer.answer}

Rationale: ${q.rationale}
`).join("\n")}
`).join("\n---\n")}

These references are your training data. Analyze them to understand:
1) How CAT odd-one-out questions are framed
2) What makes four sentences/three similar and one different
3) How the difference is subtle but identifiable
4) How distractors are designed to confuse

---

## SEMANTIC IDEAS (CONTENT SOURCE)

<SEMANTIC_IDEAS>
${JSON.stringify(semanticIdeas, null, 2)}
</SEMANTIC_IDEAS>

## AUTHORIAL PERSONA (STYLE GUIDE)

<AUTHORIAL_PERSONA>
${JSON.stringify(authorialPersona, null, 2)}
</AUTHORIAL_PERSONA>

---

## GENERATION REQUIREMENTS

Generate 1 odd-one-out question based on the semantic ideas and conceptual pairs.

The question should:
- Present 5 jumbled sentences in jumbled_sentences object (keys "1" through "5")
- 4 sentences should share a common theme, logical structure, or conceptual relationship
- 1 sentence (the "odd one") should differ in a subtle but meaningful way
- Use the conceptual_pairs from semantic ideas to create the 4 similar ones
- The difference should be in: tone, logical flow, underlying assumption, or argumentative approach

---

## OPTION DESIGN RULES

Similar sentences (4 sentences):
- Should share a clear common theme or structure
- Should be thematically or logically coherent together
- Should derive from semantic ideas
- These will be placed in jumbled_sentences with keys "1" through "4"

Odd one out (correct answer):
- Should seem similar at first glance
- Should have a subtle but meaningful difference
- The difference should be identifiable through careful analysis
- Could differ in: stance, assumption, logical direction, or conclusion
- This will be the 5th sentence placed in jumbled_sentences with key "5"

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": null,
      "question_text": "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer:",
      "question_type": "odd_one_out",
      "options": null,
      "jumbled_sentences": {
        "1": "<sentence>",
        "2": "<sentence>",
        "3": "<sentence>",
        "4": "<sentence>",
        "5": "<sentence>"
      },
      "correct_answer": { "answer": "<1|2|3|4|5>" },
      "rationale": "",
      "difficulty": "easy|medium|hard",
      "tags": [],
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>"
    }
  ]
}

IMPORTANT:
- Fill jumbled_sentences with 5 sentences in ANY order (4 similar + 1 odd one out)
- options should be null
- correct_answer.answer should be number of odd sentence (1, 2, 3, 4, or 5)
- Leave rationale empty
- Generate EXACTLY 1 question
- No additional text or commentary
`;

        console.log("⏳ [Odd One Out] Waiting for LLM to generate questions");

        const completion = await client.chat.completions.parse({
            model: MODEL,
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC examiner. You design reasoning questions with carefully constructed traps.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(VAQuestionsResponseSchema, "va_questions"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed || parsed.questions.length === 0) {
            throw new Error("Invalid odd-one-out question generation output");
        }

        console.log(`✅ [Odd One Out] Generated ${parsed.questions.length} questions`);

        return parsed.questions.map(q => ({
            ...q,
            created_at: now,
            updated_at: now,
        }));

    } catch (error) {
        console.error("❌ [Odd One Out] Error generating questions:", error);
        throw error;
    }
}
