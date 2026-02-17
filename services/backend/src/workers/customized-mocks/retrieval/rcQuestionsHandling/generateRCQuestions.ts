import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Passage, Question, QuestionSchema } from "../../schemas/types";
import { v4 as uuidv4 } from 'uuid';
import { CostTracker } from "../../../../common/utils/CostTracker";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('rc-questions-gen');
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Groups questions with their associated passages for use as reference data.
 */
export function groupQuestionsWithPassages(passages: Passage[], questions: Question[]) {
    return passages.slice(0, 3).map(passage => {
        return {
            passage: passage,
            questions: questions.filter(q => q.passage_id === passage.id)
        };
    });
}

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

    // For 4+ questions
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

export async function generateRCQuestions(
    params: {
        passageData: any;
        referenceData: ReferenceDataSchema[];
        questionCount: number;
        personalization?: {
            targetMetrics?: string[];
            weakAreas?: string[];
        };
    },
    costTracker?: CostTracker
) {
    const { passageData, referenceData, questionCount, personalization } = params;

    logger.info(`🧩 [RC Questions] Starting generation (${questionCount} questions)`);

    const difficultyTargets = getDefaultDifficultyTargets(questionCount);

    // Build personalization instructions
    let personalizationInstructions = "";
    if (personalization) {
        const instructions = [];

        if (personalization.targetMetrics && personalization.targetMetrics.length > 0) {
            instructions.push(`Target Metrics: Design questions to specifically test these core metrics - ${personalization.targetMetrics.join(", ")}`);
        }

        if (personalization.weakAreas && personalization.weakAreas.length > 0) {
            instructions.push(`Weak Areas: Include question types that challenge these areas - ${personalization.weakAreas.join(", ")}`);
        }

        if (instructions.length > 0) {
            personalizationInstructions = `

### PERSONALIZATION INSTRUCTIONS

The following user-specific customization should guide question generation:

${instructions.map((instr, i) => `${i + 1}. ${instr}`).join("\n")}

IMPORTANT: Apply personalization naturally while maintaining CAT quality.
`;
        }
    }

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
- Two past CAT passages with their questions

These references are your training data.
You must DEEPLY STUDY them to understand:
1) How CAT questions are framed — your output MUST be indistinguishable from these
2) How traps are constructed — replicate the EXACT subtlety and sophistication
3) How inference depth is calibrated — match the reasoning complexity of actual CAT papers
4) How options are worded to avoid obvious clues — every option must feel like a genuine CAT option
5) The STYLE and STRUCTURE of questions — NOT the specific topics or subject matter
6) A student solving your questions should feel like they are solving an actual CAT paper

⚠️ CRITICAL RULE — REFERENCE MATERIAL ISOLATION:
- You MUST NOT bring any topics, examples, arguments, or factual claims from the reference passages into your generated questions.
- The reference material is ONLY for learning the PATTERN of question construction.
- Your questions must be derived EXCLUSIVELY from the NEW PASSAGE provided below.
- If any generated option or question stem contains content from the reference passages, it will be REJECTED.

---

## CAT RC QUESTION TYPES — COMPREHENSIVE TAXONOMY

CAT RC questions test multiple cognitive modes within the same passage.
You MUST generate a heterogeneous set—avoid repeating the same logical pattern.

### CORE QUESTION TYPES (Use these as your primary toolkit):

**1. EXCEPT / NOT INFERABLE**
- Form: "All of the following can be inferred EXCEPT:" or "Which CANNOT be inferred?"
- 3 options are logically supported; 1 subtly violates scope/certainty/causality
- Wrong option feels plausible but overreaches or reverses logic

**2. CHARACTERISTIC / FOLLOWING FROM PASSAGE**
- Form: "Following from the passage, which is a characteristic of X?"
- Requires abstraction and synthesis across multiple ideas
- Wrong options sound ideologically attractive but lack support

**3. NARRATIVE / FLOW / SEQUENCE**
- Form: "Which sequence best captures the narrative?"
- Tests passage structure, not just content
- Options rearrange same ideas in misleading orders

**4. ARGUMENTS MADE / NOT MADE**
- Form: "All of the following arguments are made EXCEPT:"
- Tests authorial commitment vs mere mention
- Wrong option sounds reasonable but is only implied or absent

**5. COMPLEMENT / STRENGTHEN**
- Form: "Which would best complement the passage's findings?"
- Extends empirical/conceptual reach (not logical strengthening)
- Often uses analogies from unrelated domains

**6. EXPERIMENT / STUDY INFERENCE**
- Form: "Which cannot be inferred from the experiment?" or "Which demonstrates X?"
- Requires understanding experimental design and constraints
- Wrong answers smuggle new assumptions or violate conditions

**7. EXAMPLE FUNCTION / PURPOSE**
- Form: "Which best explains the complexity illustrated by example X?"
- Tests WHY an example exists, not WHAT it says
- Wrong options restate content instead of rhetorical function

**8. INVALIDATION / PURPOSE-BREAKING**
- Form: "Which, if true, would invalidate the purpose of the example?"
- Requires reverse reasoning
- Correct option collapses the analogy or demonstration

**9. WORLDVIEW / PHILOSOPHICAL ALIGNMENT**
- Form: "Which worldview is closest to that of X?"
- Highly abstract—mirrors belief structure, not surface similarity
- Wrong options rely on superficial resemblance

**10. ABSTRACT PROCESS / OPPOSITE**
- Form: "Which comes closest to the opposite of democratization?"
- Tests conceptual precision stripped of emotional valence
- Wrong options use politically charged but logically incorrect terms

**11. CENTRAL THEME / CHOICE BETWEEN**
- Form: "The central theme is about the choice between:"
- Requires collapsing passage into a tension or trade-off
- Wrong options isolate only one side

**12. AUTHORIAL OVEREMPHASIS / CRITICAL DISTANCE**
- Form: "Regarding which could we argue the author overemphasizes X?"
- Meta-critical—tests reader's ability to distance from author
- Wrong options are descriptive, not evaluative

**13. ASSUMPTION NECESSITY**
- Form: "Which assumption is most necessary for the suggestion to hold?"
- Tests causal dependency in argument chain
- Correct option enables the chain; others are irrelevant or too strong

**14. TAIL RISK / COMPLEX SYSTEMS**
- Form: "Which observation would strengthen the claim that X leads to Y?"
- Tests statistical reasoning
- Correct option shows clustering or second-order effects

**15. WORD / PHRASE IN CONTEXT**
- Form: "The phrase 'sui generis' suggests:"
- Meaning from usage, not dictionary
- Wrong options are near-synonyms

**16. FUNCTION OF A REFERENCE**
- Form: "The mention of X does all the following EXCEPT:"
- Tests multi-function references
- Correct answer identifies the missing function

**17. TONE / PURPOSE / MAIN IDEA**
- Form: "The author's tone is best described as:" or "The main purpose is:"
- Passage-level synthesis
- Wrong options: opposite tone, too neutral, too extreme, wrong target

CRITICAL RULES:
- Do NOT repeat the same logical move twice
- Validate each question against the PYQ references AND this taxonomy

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

ANALYSIS FOCUS:
- Question wording patterns
- Option construction patterns
- Trap types used in distractors
- Inference depth
- Language calibration

---

## STEP 2: GENERATE QUESTIONS FOR NEW PASSAGE

NEW PASSAGE (TARGET):
${passageData.passageData.content}

---

### GENERATION REQUIREMENTS

Generate EXACTLY ${questionCount} questions with MAXIMUM DIVERSITY.

MANDATORY REQUIREMENTS:
1. MUST include at least:
   - One EXCEPT / NOT question (type 1, 4, or 16)
   - One abstraction or worldview question (type 2, 9, 11, or 17)
   - One assumption / inference chain question (type 5, 6, 8, or 13)
2. Avoid repeating the same logical move twice
3. Ensure heterogeneous question set—no uniform pattern across questions

QUESTION SELECTION STRATEGY:
- Choose question types that best fit the passage content and structure
- Vary cognitive demands: some literal, some inferential, some meta-level
- Mix passage-level questions with detail-oriented questions
- Balance abstract reasoning with concrete evidence-based questions
- Prefer questions that require MULTI-PARAGRAPH synthesis over single-paragraph extraction
- At least 1 question MUST require connecting ideas from 2+ different paragraphs
${personalizationInstructions}

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

### DIVERSITY ENFORCEMENT

CRITICAL ANTI-PATTERNS TO AVOID:
❌ DO NOT ask fact-recall questions
❌ DO NOT ask vocabulary definition questions (unless passage-driven context is key)
❌ DO NOT repeat "main idea" questions in different wording
❌ DO NOT make the correct option obviously longer or more nuanced
❌ DO NOT let all wrong options fail for the same reason

INTERNAL QUALITY CHECK (do not output):
- For each question, internally label the cognitive skill tested
- Verify no two questions test the same skill in the same way
- Ensure wrong options fail for DIFFERENT reasons across the question set

---

### QUESTION CONSTRUCTION PRINCIPLES

1) QUESTION PHRASING:
- Use precise, academic language
- Avoid clues in the stem
- Prefer indirect phrasing ("best supported", "most strongly implied", "can be inferred")
- Use EXCEPT/NOT formulations strategically to test comprehensive understanding

2) OPTION DESIGN (CRITICAL):
- All 4 options (A–D) must be plausibly attractive
- No two options should be semantically identical
- Each wrong option must be:
  * Internally coherent
  * Logically motivated
  * Wrong for ONE precise reason (not obviously false)
- Vary distractor types across options:
  * literal trap (sounds like a paraphrase but misses nuance)
  * extreme trap (over-extends the claim)
  * narrow/broad trap (partial match, wrong scope)
  * opposite trap (contradicts while borrowing vocabulary)
  * irrelevant-but-plausible trap (general truth, wrong for this passage)

⚠️ OPTION LENGTH VARIATION (MANDATORY):
- Options MUST vary significantly in length across the question set
- Avoid making the correct option consistently the longest or most detailed
- Within a single question, at least one wrong option should be LONGER than the correct one
- Mix short (5-15 words), medium (15-30 words), and long (30+ words) options
- If all 4 options are roughly the same length, the question WILL BE REJECTED

3) INFERENCE DEPTH:
- Each question should require at least 2 logical steps
- Wrong options should be reachable by common CAT-style reasoning errors
- Correct option should reward careful, multi-step reasoning

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
- The question should be able to assess the metrics from
- The question should be able to assess the metrics from ${JSON.stringify(user_core_metrics_definition_v1)} file and try to divide all the metrics across 4 questions. file and try to divide all the metrics across all questions.
`;

    logger.info("⏳ [RC Questions] Waiting for LLM to generate questions");
    // logger.debug("Ref Data (First Item):", JSON.stringify(referenceData[0] || {}).substring(0, 500) + "...");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.4,
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

    logger.info("✅ [RC Questions] LLM response received");

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questions.length !== questionCount) {
        throw new Error("Invalid RC question generation output");
    }

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateRCQuestions",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    logger.info(`✅ [RC Questions] Generated ${parsed.questions.length} questions`);

    const now = new Date().toISOString();
    return parsed.questions.map(q => ({
        ...q,
        id: uuidv4(),
        passage_id: passageData.passageData.id,
        created_at: now,
        updated_at: now
    }));
}
