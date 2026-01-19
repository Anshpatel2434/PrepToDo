import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Passage, Question, QuestionSchema } from "../../schemas/types";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Groups questions with their associated passages for use as reference data.
 * This is exported for use in VA question generation.
 */
export function groupQuestionsWithPassages(passages, questions) {
    return passages.slice(0, 3).map(passage => {
        return {
            passage: passage,
            questions: questions.filter(q => q.passage_id === passage.id)
        };
    });
}

/**
 * Generates CAT-style RC questions using reference PYQs for pattern learning.
 *
 * Recent tweaks:
 * - Adds an explicit CAT-RC taxonomy (broad understanding / inference / data-based) as an additional anchor
 * - Forces realistic difficulty variation (to avoid everything defaulting to "medium")
 * - Adds clearer progress logging, including "waiting for LLM" markers
 */

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

const ResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

type Difficulty = "easy" | "medium" | "hard";

function getDefaultDifficultyTargets(questionCount: number): Difficulty[] {
    if (questionCount <= 0) return [];
    if (questionCount === 1) return ["medium"];
    if (questionCount === 2) return ["easy", "hard"];
    if (questionCount === 3) return ["easy", "medium", "hard"];

    // For the standard 4-question set:
    // 1) inference = harder
    // 2) tone/purpose = medium
    // 3) detail-based = easier
    // 4) main idea/implication = medium
    const targets: Difficulty[] = ["hard", "medium", "easy"];
    while (targets.length < questionCount) targets.push("medium");
    return targets;
}

function ensureDifficultyVariety(questions: Question[], questionCount: number): Question[] {
    const present = questions
        .map((q) => q.difficulty)
        .filter((d): d is Exclude<Question["difficulty"], null> => d !== null);

    const unique = new Set(present);

    if (present.length === 0 || unique.size <= 1) {
        const targets = getDefaultDifficultyTargets(questionCount);
        return questions.map((q, i) => ({
            ...q,
            difficulty: targets[i] ?? "medium",
        }));
    }

    return questions;
}

// Simple UUID generator
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function generateRCQuestions(params: {
    passageText: string;
    referenceData: ReferenceDataSchema[];
    questionCount: number;
}) {
    const { passageText, referenceData, questionCount } = params;

    console.log(`🧩 [RC Questions] Starting generation (${questionCount} questions)`);

    const difficultyTargets = getDefaultDifficultyTargets(questionCount);

    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design questions that test reasoning, not comprehension.
You construct traps that expose weak thinking patterns.

CRITICAL MINDSET:
- You are NOT creating simple comprehension questions
- You are creating reasoning questions that demand inference/synthesis
- Every option must be deliberately designed to test a specific reasoning weakness

---

USER:
Your task is to generate CAT-style RC questions for the NEW passage.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
- Three past CAT passages with their questions

These references are your training data.
You must ANALYZE them to understand:
1) How CAT questions are framed
2) How traps are constructed
3) How inference depth is calibrated
4) How options are worded to avoid obvious clues

---

## ADDITIONAL ANCHOR: CAT RC QUESTION TAXONOMY (Study + Compare to PYQs)

CAT RC questions commonly fall into these buckets:

A) Broad understanding (answers not directly stated; requires passage-level grasp)
- Central idea / Main purpose
- Purpose of a paragraph / sentence
- Tone of the author/entity
- Suitable title
- Source / author profession ("the author is most likely...")

B) Inference / suggestion (evidence exists, but answer is not directly stated)
- What can be inferred / implied?
- What is suggested / assumed?
- Relationship between X and Y
- Analogy to the argument/issue in the passage

C) Information/data-based (answer is in the passage, but may need careful interpretation)
- The author is likely to agree with all EXCEPT
- Reason why something is ineffective
- A specific factual/argument-detail check (not a verbatim scan)

RULE:
- Use this taxonomy to generate question stems that are CAT-realistic.
- Validate each question against BOTH (i) the PYQ references and (ii) the taxonomy above.

---

## STEP 1: ANALYZE REFERENCE MATERIAL (Internal Reasoning — Do Not Output)

PASSAGE 1 + QUESTIONS:
${referenceData[0].passage.content}
Questions:
${JSON.stringify(referenceData[0].questions.slice(0, 4), null, 2)}

PASSAGE 2 + QUESTIONS:
${referenceData[1].passage.content}
Questions:
${JSON.stringify(referenceData[1].questions.slice(0, 4), null, 2)}

PASSAGE 3 + QUESTIONS:
${referenceData[2].passage.content}
Questions:
${JSON.stringify(referenceData[2].questions.slice(0, 4), null, 2)}

ANALYSIS FOCUS:
- Question wording patterns
- Option construction patterns
- Trap types used in distractors
- Inference depth
- Language calibration

---

## STEP 2: GENERATE QUESTIONS FOR NEW PASSAGE

NEW PASSAGE (TARGET):
${passageText}

---

### GENERATION REQUIREMENTS

Generate EXACTLY ${questionCount} questions in this order:

1) INFERENCE / SUGGESTION (≥1)
- Derive an unstated conclusion OR relationship OR assumption (taxonomy bucket B)
- Correct option requires multi-step reasoning

2) TONE / PURPOSE (≥1)
- Either tone OR purpose (taxonomy bucket A)
- Distractors: opposite tone, too neutral, too extreme, wrong target (author vs. a group in passage)

3) INFORMATION/DETAIL (≥1)
- Evidence in the passage but requires careful interpretation (taxonomy bucket C)
- Avoid verbatim lifting; require understanding of what a line/claim implies

4) MAIN IDEA / IMPLICATION / TITLE-LIKE (≥1)
- Passage-level synthesis (taxonomy bucket A)
- Can be framed as central idea, main purpose, implication, suitable title, or author-likely-to-be

---

### DIFFICULTY ASSIGNMENT (MANDATORY)

Assign a realistic difficulty level to each question: easy | medium | hard.
Use these guidelines:
- easy: answerable via localized evidence + simple interpretation; distractors are less subtle
- medium: needs synthesis within a paragraph or across two parts; distractors are plausible
- hard: multi-paragraph inference / subtle stance calibration / close distractors

To avoid uniform difficulty, target this set-level distribution:
${difficultyTargets.map((d, i) => `- Q${i + 1}: ${d}`).join("\n")}

---

### QUESTION CONSTRUCTION PRINCIPLES

1) QUESTION PHRASING:
- Use precise, academic language
- Avoid clues in the stem
- Prefer indirect phrasing ("best supported", "most strongly implied")

2) OPTION DESIGN:
- All 4 options (A–D) must be plausibly attractive
- No two options should be semantically identical
- Vary distractor types across options:
  * literal trap (sounds like a paraphrase but misses nuance)
  * extreme trap (over-extends)
  * narrow/broad trap (partial match)
  * opposite trap (contradicts while borrowing vocabulary)
  * irrelevant-but-plausible trap (general truth, wrong for this passage)

3) INFERENCE DEPTH:
- Each question should require at least 2 logical steps
- Wrong options should be reachable by common CAT-style reasoning errors

---

### OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "<UUID>",
      "question_text": "<text>",
      "question_type": "rc_question",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "jumbled_sentences": { "1": "", "2": "", "3": "", "4": "", "5": "" },
      "correct_answer": { "answer": "" },
      "rationale": "",
      "difficulty": "easy|medium|hard",
      "tags": [],
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>"
    }
  ]
}

IMPORTANT:
- Leave correct_answer.answer empty
- Leave rationale empty
- Generate EXACTLY ${questionCount} questions
- No additional text or commentary
- The question should be able to assess the metrics from ${JSON.stringify(user_core_metrics_definition_v1)} file and try to divide all the metrics across 4 questions.
`;

    console.log("⏳ [RC Questions] Waiting for LLM to generate questions");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content:
                    "You are a CAT VARC examiner. You design reasoning questions with carefully constructed traps. You do not solve questions or provide explanations.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(ResponseSchema, "rc_questions"),
    });

    console.log("✅ [RC Questions] LLM response received");

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questions.length !== questionCount) {
        throw new Error("Invalid RC question generation output");
    }

    // const now = new Date().toISOString();

    // let questions = parsed.questions.map((q) => ({
    //     ...q,
    //     passage_id: null,
    //     correct_answer: { answer: "" },
    //     rationale: "",
    //     tags: [],
    //     jumbled_sentences: {
    //         1: q.options.A,
    //         2: q.options.B,
    //         3: q.options.C,
    //         4: q.options.D,
    //     },
    //     created_at: now,
    //     updated_at: now,
    // }));

    // questions = ensureDifficultyVariety(questions, questionCount);

    console.log(`✅ [RC Questions] Generated ${parsed.questions.length} questions`);

    const now = new Date().toISOString();
    return parsed.questions.map(q => ({
        ...q,
        id: generateUUID(),
        created_at: now,
        updated_at: now
    }));
}
