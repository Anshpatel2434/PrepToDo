import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {z} from "zod"
import { Passage, Question, QuestionSchema } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates CAT-style RC questions using reference PYQs for pattern learning.
 *
 * The prompt is designed to:
 * 1. Force the LLM to analyze PYQ patterns before generating
 * 2. Provide detailed guidance on question construction principles
 * 3. Specify trap construction techniques learned from actual CAT papers
 * 4. Enforce proper inference depth and language calibration
 * 5. Require validation checks before output
 *
 * Key improvements over previous version:
 * - Internal reasoning step (analyzing references) is explicitly required
 * - Specific question type distribution is mandated
 * - Detailed trap construction patterns are provided
 * - Validation checklist ensures quality control
 * - Temperature increased slightly to allow more creative trap construction
 */

interface ReferenceDataSchema {
    passage : Passage;
    questions: Question[];
}

const ResponseSchema = z.object({
    questions : z.array(QuestionSchema)
})

export async function generateRCQuestions(params: {
    passageText: string;
    referenceData: ReferenceDataSchema[];
    questionCount: number;
}) {
    const {
        passageText,
        referenceData,
        questionCount,
    } = params;

    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design questions that test reasoning, not comprehension.
You construct traps that expose weak thinking patterns.

CRITICAL MINDSET:
- You are NOT creating comprehension questions
- You are creating reasoning questions
- Every question must involve inference, not restatement
- Every option must be deliberately designed to test a specific reasoning weakness

---

USER:
Your task is to generate CAT-style RC questions for the NEW passage.

You are given REFERENCE MATERIAL from actual CAT papers:
- Three past CAT passages with their questions

IMPORTANT: These references are your training data.
You must ANALYZE them to understand:
1. How CAT questions are framed
2. How traps are constructed
3. How inference depth is calibrated
4. How options are worded to avoid obvious clues

---

## STEP 1: ANALYZE REFERENCE MATERIAL (Internal Reasoning - Do Not Output)

Before generating any questions, study the reference material carefully:

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
- Question wording patterns (how are they phrased?)
- Option construction (what makes each option distinct?)
- Trap types (what errors do incorrect options contain?)
- Inference depth (how much reasoning is required?)
- Language complexity (academic vs. accessible)

---

## STEP 2: GENERATE QUESTIONS FOR NEW PASSAGE

NEW PASSAGE (TARGET):
${passageText}

---

### GENERATION REQUIREMENTS

Generate EXACTLY ${questionCount} questions with this distribution:

1. INFERENCE QUESTION (1 question)
- Tests ability to derive unstated conclusions
- Correct option requires multiple-step reasoning
- Distractors: literal restatements, extreme interpretations, irrelevant inferences

2. TONE OR PURPOSE QUESTION (1 question)
- Tone: Tests understanding of author's stance/attitude
- Purpose: Tests understanding of what the passage is trying to achieve
- Distractors: opposite tone, extreme stance, too specific purpose

3. DETAIL-BASED QUESTION (1 question)
- Tests precise understanding of specific claims
- NOT a simple "locate and repeat" question
- Must require interpretation, not matching
- Distractors: similar-sounding but wrong, distorted details, unsupported claims

4. IMPLICATION / MAIN IDEA QUESTION (1 question)
- Tests grasp of broader implications or central argument
- Must require synthesis, not identification
- Distractors: too narrow, too broad, contradictory, missing the point

---

### QUESTION CONSTRUCTION PRINCIPLES

For EVERY question, follow these rules derived from your analysis:

1. QUESTION PHRASING:
- Use precise, academic language
- Avoid giving away clues in the question
- Frame questions that require reasoning, not recall
- Use indirect phrasing (e.g., "Which of the following is best supported by the passage?" not "What does the passage say?")

2. OPTION DESIGN:
- Each of the 4 options (A, B, C, D) must be plausibly attractive
- Ensure no two options are semantically identical
- Make the correct answer the second-most attractive (students should gravitate to a distractor)
- Vary distractor types across options:
  * Literal trap: sounds right but misses the point
  * Extreme trap: goes beyond what passage supports
  * Narrow trap: true but too specific
  * Opposite trap: contradicts the passage

3. LANGUAGE CALIBRATION:
- Match the abstraction level of reference questions
- Use appropriate academic vocabulary (not too simple, not unnecessarily complex)
- Avoid absolute words ("always", "never", "must") unless the passage explicitly supports them
- Use qualifying language ("tends to", "suggests", "implies") where appropriate

4. INFERENCE DEPTH:
- Each question should require 2-3 logical steps
- The path from passage to correct answer should not be obvious
- The wrong answer should be reached by common reasoning errors

---

### SPECIFIC TRAP CONSTRUCTION (Learned from PYQs)

Design your distractors using these patterns:

TYPE 1: LITERAL INTERPRETATION TRAP
- Looks like a direct quote or paraphrase
- But misses the subtle nuance or qualification
- Attracts students who scan instead of reason

TYPE 2: EXTENSION BEYOND PASSAGE TRAP
- Claims something that could be true based on passage
- But the passage never actually supports it
- Attracts students who "fill in the gaps" too liberally

TYPE 3: OPPOSITE INTERPRETATION TRAP
- Contradicts the passage's actual stance
- But uses familiar passage vocabulary
- Attracts students who misread or misunderstand

TYPE 4: TOO NARROW OR TOO BROAD TRAP
- Captures part of the truth but not the full picture
- Attracts students who latch onto partial matches

TYPE 5: IRRELEVANT BUT PLAUSIBLE TRAP
- Sounds reasonable in general
- But not related to what the question is asking
- Attracts students who lose track of the question

Each distractor should correspond to a different trap type.

---

### FINAL VALIDATION CHECKLIST

Before outputting each question, verify:

✓ Question cannot be answered by scanning alone
✓ All 4 options are semantically distinct
✓ No option is an obvious giveaway (too simple or too extreme)
✓ Correct answer requires inference or synthesis
✓ Each wrong option corresponds to a common reasoning error
✓ Language complexity matches reference questions
✓ Tone matches CAT question style (direct, precise, academic)

---

### OUTPUT FORMAT

Return STRICT JSON array with questions following this schema:

{
  "questions": [
    {
      "id": "<UUID>",
      "question_text": "<question text>",
      "question_type": "rc_question",
      "options": {
        "A": "<option text>",
        "B": "<option text>",
        "C": "<option text>",
        "D": "<option text>"
      },
      "correct_answer": { "answer": "" },
      "rationale": "",
      "difficulty": "easy|medium|hard",
      "tags": []
    }
  ]
}

IMPORTANT:
- Leave correct_answer.answer empty (you do NOT select answers)
- Leave rationale empty (you do NOT write explanations)
- Generate EXACTLY ${questionCount} questions
- No additional text or commentary
`;

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content: "You are a CAT VARC examiner. You design reasoning questions with carefully constructed traps. You do not solve questions or provide explanations.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "rc_questions"
        ),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questions.length !== questionCount) {
        throw new Error("Invalid RC question generation output");
    }

    return parsed.questions;
}
