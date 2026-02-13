// generateVAQuestions.ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema, Passage, SemanticIdeas, AuthorialPersona } from "../../schemas/types";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";
import { CostTracker } from "../../../../common/utils/CostTracker";
import { v4 as uuidv4 } from 'uuid';
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('va-questions-gen');
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface QAReferenceDataSchema {
    questions: Question[];
}

interface GenerateVAQuestionsParams {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: QAReferenceDataSchema[];
    referenceQuestions?: QAReferenceDataSchema; // Added this field
    passageText: string;
    questionDistribution?: {
        para_summary?: number;
        para_completion?: number;
        para_jumble?: number;
        odd_one_out?: number;
    };
    personalization?: {
        targetMetrics?: string[];
        weakAreas?: string[];
    };
}

const VAQuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

/**
 * Generates all VA question types based on distribution specified.
 */
export async function generateVAQuestions(
    params: GenerateVAQuestionsParams,
    costTracker?: CostTracker
) {
    try {
        const { semanticIdeas, authorialPersona, referenceQuestions, passageText, questionDistribution, personalization } = params;

        // Set default distribution
        const distribution = questionDistribution || {
            para_summary: 0,
            para_completion: 0,
            para_jumble: 0,
            odd_one_out: 0,
        };

        logger.info(`🧩 [VA Questions] Starting generation`);
        logger.info({ distribution }, "Distribution");

        // Combine standard reference data with specific reference questions if provided
        let allReferences = [];
        if (referenceQuestions) {
            allReferences.push(referenceQuestions);
        }

        // Filter reference data by question type
        const summaryReferences = allReferences
            .filter(rd => rd.questions.some(q => q.question_type === "para_summary"))
            .map(rd => ({
                questions: rd.questions.filter(q => q.question_type === "para_summary").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);



        const completionReferences = allReferences
            .filter(rd => rd.questions.some(q => q.question_type === "para_completion"))
            .map(rd => ({
                questions: rd.questions.filter(q => q.question_type === "para_completion").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);



        const jumbleReferences = allReferences
            .filter(rd => rd.questions.some(q => q.question_type === "para_jumble"))
            .map(rd => ({
                questions: rd.questions.filter(q => q.question_type === "para_jumble").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);



        const oddOneOutReferences = allReferences
            .filter(rd => rd.questions.some(q => q.question_type === "odd_one_out"))
            .map(rd => ({
                questions: rd.questions.filter(q => q.question_type === "odd_one_out").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);

        const allQuestions: Question[] = [];
        const now = new Date().toISOString();

        // Generate para_summary questions
        if (distribution.para_summary && distribution.para_summary > 0 && summaryReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 3) {
            try {
                const summaryQuestions = await generateParaSummaryQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: summaryReferences,
                    passageText,
                    count: distribution.para_summary,
                    personalization
                }, costTracker);
                allQuestions.push(...summaryQuestions);
                logger.info(`✅ [VA Questions] Generated ${summaryQuestions.length} para_summary questions`);
            } catch (error) {
                logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Failed to generate para_summary");
            }
        }

        // Generate para_completion questions
        if (distribution.para_completion && distribution.para_completion > 0 && completionReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 4) {
            try {
                const completionQuestions = await generateParaCompletionQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: completionReferences,
                    passageText,
                    count: distribution.para_completion,
                    personalization
                }, costTracker);
                allQuestions.push(...completionQuestions);
                logger.info(`✅ [VA Questions] Generated ${completionQuestions.length} para_completion questions`);
            } catch (error) {
                logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Failed to generate para_completion");
            }
        }

        // Generate para_jumble questions
        if (distribution.para_jumble && distribution.para_jumble > 0 && jumbleReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 4) {
            try {
                const jumbleQuestions = await generateParaJumbleQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: jumbleReferences,
                    passageText,
                    count: distribution.para_jumble,
                    personalization
                }, costTracker);
                allQuestions.push(...jumbleQuestions);
                logger.info(`✅ [VA Questions] Generated ${jumbleQuestions.length} para_jumble questions`);
            } catch (error) {
                logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Failed to generate para_jumble");
            }
        }

        // Generate odd_one_out questions
        if (distribution.odd_one_out && distribution.odd_one_out > 0 && oddOneOutReferences.length > 0 && semanticIdeas.conceptual_pairs.length >= 3) {
            try {
                const oddOneOutQuestions = await generateOddOneOutQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: oddOneOutReferences,
                    passageText,
                    count: distribution.odd_one_out,
                    personalization
                }, costTracker);
                allQuestions.push(...oddOneOutQuestions);
                logger.info(`✅ [VA Questions] Generated ${oddOneOutQuestions.length} odd_one_out questions`);
            } catch (error) {
                logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Failed to generate odd_one_out");
            }
        }

        logger.info(`✅ [VA Questions] Total VA questions generated: ${allQuestions.length}`);

        // Final pass to ensure all questions have fresh UUIDs and proper field initialization
        const finalQuestions = allQuestions.map(q => ({
            ...q,
            id: uuidv4(),
            passage_id: null, // VA questions are standalone
            jumbled_sentences: q.jumbled_sentences || { "1": "", "2": "", "3": "", "4": "", "5": "" },
            options: q.options || { "A": "", "B": "", "C": "", "D": "" },
            created_at: now,
            updated_at: now
        }));

        logger.info("✅ [VA Questions] Finalized VA questions with fresh IDs");
        return finalQuestions;
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "❌ [VA Questions] Error in generateVAQuestions");
        throw error;
    }
}

/**
 * Generates para_summary questions
 */
async function generateParaSummaryQuestions(
    params: {
        semanticIdeas: SemanticIdeas;
        authorialPersona: AuthorialPersona;
        referenceData: QAReferenceDataSchema[];
        passageText: string;
        count: number;
        personalization?: any;
    },
    costTracker?: CostTracker
) {
    const { semanticIdeas, authorialPersona, referenceData, passageText, count, personalization } = params;
    const now = new Date().toISOString();

    const summaryLogger = createChildLogger('para-summary');
    logger.info({ count }, `Starting para-summary generation`);

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
You design para-summary questions that test STRUCTURE and LOGICAL EMPHASIS.

═══════════════════════════════════════════════════════════════════════════════
FUNDAMENTAL TRUTH: CAT VA questions are NOT language exercises. They are LOGIC TESTS.
═══════════════════════════════════════════════════════════════════════════════

CRITICAL MINDSET:
- You are NOT creating simple restatements
- You are creating questions that require understanding core message
- Every option must be deliberately designed to test a specific reasoning weakness

---

## CORE COGNITIVE INTENT

Para Summary questions test the ability to:
- Identify the author's CORE CLAIM (not topic restatement)
- Suppress examples, tone flourishes, and metaphors
- Preserve LOGICAL EMPHASIS, not wording

Summaries are NOT:
❌ Topic restatements
❌ Shortened versions of one paragraph
❌ Emotionally attractive paraphrases

---

USER:
Your task is to generate CAT-style para-summary questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `

QUESTIONS:
${rd.questions.slice(0, 2).map((q, j) => `
Q${j + 1}: ${q.question_text}
Options:
A) ${q.options["A"]}
B) ${q.options["B"]}
C) ${q.options["C"]}
D) ${q.options["D"]}

Correct: ${q.correct_answer.answer}

Rationale: ${q.rationale}
`).join("\n")}
`).join("\n---\n")}

These references are your training data. Analyze them to understand:
1) How CAT para-summary questions are framed
2) How options are constructed
3) What makes a summary "best"
4) How distractors are designed to be tempting but incorrect

---

## SEMANTIC IDEAS (CONTENT SOURCE)

<SEMANTIC_IDEAS>
${JSON.stringify(semanticIdeas, null, 2)}
</SEMANTIC_IDEAS>

## AUTHORIAL PERSONA (STYLE GUIDE)

<AUTHORIAL_PERSONA>
${JSON.stringify(authorialPersona, null, 2)}
</AUTHORIAL_PERSONA>
${personalizationInstructions}

---

## GENERATION REQUIREMENTS

Generate ${count} para-summary question(s) based on the semantic ideas and authorial persona.

Each question should:
- Present a short paragraph (3-5 sentences) derived from the semantic ideas
- This paragraph should embody the authorial persona and logical flow
- Ask for the best summary of the paragraph
- There should be no mentioning of the article source or context

---

## GENERATION PROCESS

Follow this process:
1. First extract:
   - Author's central claim
   - Supporting logic (in one sentence)
2. Explicitly discard:
   - Illustrations
   - Rhetorical flourishes
3. Generate 4 summaries where:
   - Exactly ONE captures logic + stance
   - Others fail for DIFFERENT reasons
4. Ensure no option is a paraphrase of a single sentence

---

## CORRECT OPTION CHARACTERISTICS

The best summary must:
- Cover the ENTIRE passage, not just the opening
- Abstract without generalizing beyond scope
- Avoid keywords that appear verbatim in the passage
- Be neutral in tone even if passage is emotive
- Capture central tension and authorial stance

---

## WRONG OPTION DESIGN PATTERNS

Each distractor must fail for a DIFFERENT reason:

1. TOO NARROW:
   - Captures only one paragraph or detail
   - Misses the overarching argument

2. TOO BROAD:
   - Introduces a conclusion not reached
   - Generalizes beyond the passage's scope

3. EMOTIONALLY EXAGGERATED:
   - Adds moral judgment not present in passage
   - Distorts tone or stance

4. REPHRASES EXAMPLES:
   - Focuses on illustrations instead of ideas
   - Paraphrases surface content, not core logic

---

## FORBIDDEN - Will cause REJECTION

DO NOT:
- Let correct option be longest
- Use moral judgment words unless author does
- Repeat passage vocabulary excessively
- Make all wrong options partially correct (each must fail for a DIFFERENT reason)
- Allow grammar alone to eliminate options

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "",
      "question_text": "The passage given below is followed by four alternate summaries. Choose the option that best captures the essence of the passage.\\n\\n<paragraph derived from semantic ideas>",
      "question_type": "para_summary",
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
- Generate EXACTLY ${count} question(s)
- No additional text or commentary
- The question should be able to assess the metrics from "user_core_metrics_definition_v1.json" file.
`;

    summaryLogger.info(`🧩 [Para Summary] Starting generation (${count} questions)`);
    // logger.debug("Ref Data (First Item):", JSON.stringify(referenceData[0] || {}).substring(0, 500) + "...");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.5,
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
        throw new Error("Invalid para-summary question generation output");
    }

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateVAQuestions[para_summary]",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    summaryLogger.info(`✅ [Para Summary] Generated ${parsed.questions.length} questions`);

    return parsed.questions.map(q => ({
        ...q,
        created_at: now,
        updated_at: now,
    }));
}

/**
 * Generates para_completion questions
 */
async function generateParaCompletionQuestions(
    params: {
        semanticIdeas: SemanticIdeas;
        authorialPersona: AuthorialPersona;
        referenceData: QAReferenceDataSchema[];
        passageText: string;
        count: number;
        personalization?: any;
    },
    costTracker?: CostTracker
) {
    const { semanticIdeas, authorialPersona, referenceData, passageText, count, personalization } = params;
    const now = new Date().toISOString();

    const completionLogger = createChildLogger('para-completion');
    completionLogger.info(`🧩 [Para Completion] Starting generation (${count} questions)`);

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
You design para-completion questions that test DISCOURSE CONTINUITY and LOGICAL FLOW.

═══════════════════════════════════════════════════════════════════════════════
FUNDAMENTAL TRUTH: CAT VA questions are NOT language exercises. They are LOGIC TESTS.
═══════════════════════════════════════════════════════════════════════════════

CRITICAL MINDSET:
- You are NOT creating simple fill-in-the-blank exercises
- You are creating questions that require understanding the argument's direction
- Every option must be deliberately designed to test a specific reasoning weakness

---

## CORE COGNITIVE INTENT

Para Completion questions test:
- Logical flow and discourse continuity
- Cause-effect sequencing
- Referent tracking (this, that, such, they)

They are NOT grammar-fill exercises.

---

USER:
Your task is to generate CAT-style para-completion questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `

QUESTIONS:
${rd.questions.slice(0, 2).map((q, j) => `
Q${j + 1}: ${q.question_text}
Options:
A) ${q.options["A"]}
B) ${q.options["B"]}
C) ${q.options["C"]}
D) ${q.options["D"]}

Correct: ${q.correct_answer.answer}

Rationale: ${q.rationale}
`).join("\n")}
`).join("\n---\n")}

These references are your training data. Analyze them to understand:
1) How CAT para-completion questions are framed
2) Where the blank is typically placed (end of paragraph)
3) What makes a sentence complete the argument logically
4) How distractors are designed

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

Generate ${count} para-completion question based on the semantic ideas and authorial persona.

The question should follow this exact format:
1. "Sentence": A single sentence that has been removed from a paragraph.
2. "Paragraph": A paragraph (4-5 sentences) where the sentence was removed from, with 4 possible blanks marked as ___(1)___, ___(2)___, ___(3)___, and ___(4)___.

The question text should be:
"There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\\nSentence: [The missing sentence]\\nParagraph: [The paragraph with blanks]"

    Additional:  questions should mix between these categories.
        ${personalizationInstructions}

---

## GENERATION PROCESS

Follow this process:
1. First map paragraph as:
   - Idea A → Idea B → Idea C
2. Identify where:
   - Explanation is missing
   - Transition is required
3. Ensure the inserted sentence:
   - Is necessary, not decorative
4. Wrong positions must:
   - Feel tempting
   - Fail for STRUCTURAL, not grammatical reasons

---

## CORRECT PLACEMENT CHARACTERISTICS

The correct position must:
- Resolve a logical gap
- Explain or bridge surrounding ideas
- Make the following sentence inevitable
- Maintain conceptual continuity

CAT para completion relies on:
- Conceptual continuity, not sentence adjacency
- Transitional logic (contrast, continuation, consequence)
- Cohesive devices: pronouns, time markers, logical pivots

---

## WRONG PLACEMENT DESIGN PATTERNS

Each wrong position must fail for a DIFFERENT reason:

1. INTRODUCES CONCEPTS TOO EARLY:
   - Mentions ideas not yet established
   - Requires context not yet provided

2. REPEATS INFORMATION:
   - Restates what was already said
   - Creates redundancy

3. BREAKS CAUSE-EFFECT ORDER:
   - Places effect before cause
   - Disrupts logical progression

4. CREATES REDUNDANCY:
   - Makes surrounding sentences repetitive
   - Adds no new logical value

---

## FORBIDDEN - Will cause REJECTION

DO NOT:
- Use grammar errors to eliminate options
- Make only one blank "sound right" due to grammar
- Allow multiple genuinely plausible placements
- Ignore discourse markers in design
- Base elimination on grammar alone

---

## OPTION DESIGN RULES

Correct option:
- The blank where the sentence fits most logically based on coherence and flow.

Options:
- A: Option 1
- B: Option 2
- C: Option 3
- D: Option 4

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "",
      "question_text": "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\\nSentence: <sentence>\\nParagraph: <paragraph with blanks ___(1)___, ___(2)___, ___(3)___, ___(4)___>",
      "question_type": "para_completion",
      "options": { "A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4" },
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
- Generate EXACTLY ${count} questions
- No additional text or commentary
`;

    completionLogger.info("⏳ [Para Completion] Waiting for LLM to generate questions");
    // completionLogger.debug("Ref Data (First Item):", JSON.stringify(referenceData[0] || {}).substring(0, 500) + "...");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.5,
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
        throw new Error("Invalid para-completion question generation output");
    }

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateVAQuestions[para_completion]",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    return parsed.questions.map(q => ({ ...q, created_at: now, updated_at: now }));
}

/**
 * Generates para_jumble questions
 */
async function generateParaJumbleQuestions(
    params: {
        semanticIdeas: SemanticIdeas;
        authorialPersona: AuthorialPersona;
        referenceData: QAReferenceDataSchema[];
        passageText: string;
        count: number;
        personalization?: any;
    },
    costTracker?: CostTracker
) {
    const { semanticIdeas, authorialPersona, referenceData, count, personalization } = params;
    const now = new Date().toISOString();

    const jumbleLogger = createChildLogger('para-jumble');
    jumbleLogger.info(`🧩 [Para Jumble] Starting generation (${count} questions)`);

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

    // Force valid standard text to avoid hallucinated sentences in question
    const PARA_JUMBLE_TEXT = "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: ";

    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design para-jumble questions that test LOGICAL SEQUENCING.

═══════════════════════════════════════════════════════════════════════════════
FUNDAMENTAL TRUTH: CAT VA questions are NOT language exercises. They are LOGIC TESTS.
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL CONSTRAINT - FIRST SENTENCE RULE ⚠️
═══════════════════════════════════════════════════════════════════════════════

The FIRST SENTENCE of the CORRECT SEQUENCE **MUST NEVER** start with ANY of these words:
- However, Thus, Therefore, Consequently, Moreover, Furthermore, Additionally
- Hence, Nevertheless, Nonetheless, Besides, Indeed, Meanwhile
- This, That, These, Those, Such, It (when referring to prior content)
- Any word/phrase implying prior context exists

WHY: These words REQUIRE preceding context. CAT test-takers identify the opening sentence by finding the one that introduces context WITHOUT depending on prior information.

GOOD OPENING EXAMPLES (from actual CAT papers):
✅ introduces action/scenario
✅ introduces topic directly
✅ introduces subject matter
✅ introduces concept

BAD OPENING EXAMPLES (WILL BE REJECTED):
❌ implies prior situation
❌ implies prior mention of approach
❌ implies prior reasoning
❌ implies prior studies mentioned

═══════════════════════════════════════════════════════════════════════════════

CRITICAL MINDSET:
- You are NOT creating simple ordering exercises
- You are creating questions that require understanding logical connections
- The sentences must have meaningful but non-obvious connections

---

## CORE COGNITIVE INTENT

Para Jumbles test:
- Logical sequencing
- Idea dependency
- Argument scaffolding

They are NOT chronological puzzles.

---

USER:
Your task is to generate CAT-style para-jumble questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `

QUESTIONS:
${rd.questions.slice(0, 2).map((q, j) => `
Q${j + 1}: ${q.question_text}
Jumbled Sentences:
${JSON.stringify(q.jumbled_sentences, null, 2)}

Correct: ${q.correct_answer.answer}

Rationale: ${q.rationale}
`).join("\n")}
`).join("\n---\n")}

These references are your training data. Analyze them to understand:
1) How sentences are constructed for para-jumble
2) How logical connections are established
3) How distractor orderings are plausible but wrong
4) What makes the correct ordering unique

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

Generate ${count} para-jumble question based on the semantic ideas and authorial persona.

The question should:
- Present 4 sentences that can form a coherent paragraph
- Sentences should use the semantic ideas and logical transitions
- The correct ordering should create a logical argument or narrative flow
- Multiple orderings should seem plausible, but only one is truly logical

---

## ⚠️ CRITICAL: GENERATE IN CORRECT ORDER
- Generate all 4 sentences in their CORRECT LOGICAL ORDER
- Sentence 1 = opening, Sentence 2 = second, Sentence 3 = third, Sentence 4 = closing
- Do NOT scramble — our system will shuffle positions automatically
- Set correct_answer.answer to "1234"

---

## TRUE STRUCTURE OF CAT PARA JUMBLES

CAT para jumbles usually have:
- One sentence that introduces context (STANDALONE - no transition words at start)
- One or two that elaborate (may use transitions like "This", "However")
- One that concludes or generalizes

---

## GENERATION PROCESS

1. Write the OPENING sentence FIRST (sentence 1) - verify it starts with a noun, verb, or descriptive phrase (NOT a transition)
2. Write the CLOSING sentence (sentence 4) - should provide insight or implication
3. Write 2 MIDDLE sentences (sentences 2 and 3) - these CAN use transitions like "This", "However", "Moreover"
4. Place them in order: 1=opening, 2=second, 3=third, 4=closing
5. Verify: Can a test-taker identify the opener by elimination? (transition words = NOT opener)

---

## CORRECT SEQUENCE CHARACTERISTICS

The correct sequence:
- Makes each sentence necessary for the next
- Follows: introduction → development → elaboration → conclusion
- Pronouns require antecedents
- Examples require prior claims
- Conclusions cannot appear early

---

## WRONG SEQUENCE DESIGN PATTERNS

Wrong sequences must:
- Break referent clarity
- Place conclusions prematurely
- Separate example from claim

Create traps using:
- Thematic similarity (sentences seem to flow)
- Chronological illusion (time-based false ordering)

---

## SENTENCE DESIGN RULES

- Each sentence should be self-contained and meaningful
- Sentences should have logical connectors (from semantic_ideas.logical_transitions)
- The correct order should follow: introduction → development → elaboration → conclusion
- Avoid sentences that can only go in one position (too obvious)
- Create "false starts" that seem logical but lead to dead ends

    Additional:  questions should mix between these categories.
        ${personalizationInstructions}

---

## FORBIDDEN - Will cause REJECTION

DO NOT:
- Let first sentence of correct sequence start with a transition word
- Make grammar the deciding factor
- Use explicit sequence markers ("first", "finally")
- Allow more than one valid order
- Create independent sentences
- Rely on surface connectors as sole cues

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "",
      "question_text": "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: ",
      "question_type": "para_jumble",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "jumbled_sentences": {
        "1": "<sentence for position 1>",
        "2": "<sentence for position 2>",
        "3": "<sentence for position 3>",
        "4": "<sentence for position 4>",
        "5": ""
      },
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
- Fill jumbled_sentences with the 4 sentences in keys 1-4 IN CORRECT LOGICAL ORDER, leave key 5 as empty string
- Leave options as empty strings for keys A-D
- Set correct_answer.answer to "1234" (system will shuffle automatically)
- Leave rationale empty
- Generate EXACTLY ${count} question
- No additional text or commentary
- The question should be able to assess the metrics from ${user_core_metrics_definition_v1} file.
`;

    jumbleLogger.info("⏳ [Para Jumble] Waiting for LLM to generate questions");
    // jumbleLogger.debug("Ref Data (First Item):", JSON.stringify(referenceData[0] || {}).substring(0, 500) + "...");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.5,
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
        throw new Error("Invalid para-jumble question generation output");
    }

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateVAQuestions[para_jumble]",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    return parsed.questions.map(q => {
        // Shuffle sentences that were generated in correct order
        const js = q.jumbled_sentences!;
        const sentences = [
            { originalPos: 1, text: js["1"] },
            { originalPos: 2, text: js["2"] },
            { originalPos: 3, text: js["3"] },
            { originalPos: 4, text: js["4"] },
        ];
        // Fisher-Yates shuffle
        for (let i = sentences.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
        }
        // Ensure not still in order 1234
        const isStillInOrder = sentences.every((s, idx) => s.originalPos === idx + 1);
        if (isStillInOrder) {
            [sentences[0], sentences[1]] = [sentences[1], sentences[0]];
        }
        // Build new jumbled_sentences map and correct answer
        const newJumbled: Record<string, string> = { "5": "" };
        const correctOrderMap: Record<number, number> = {};
        sentences.forEach((s, idx) => {
            const newLabel = idx + 1;
            newJumbled[String(newLabel)] = s.text;
            correctOrderMap[s.originalPos] = newLabel;
        });
        const answer = [1, 2, 3, 4].map(pos => String(correctOrderMap[pos])).join("");
        return {
            ...q,
            question_text: PARA_JUMBLE_TEXT,
            jumbled_sentences: newJumbled as any,
            correct_answer: { answer },
            created_at: now,
            updated_at: now
        };
    });
}

/**
 * Generates odd_one_out questions
 */
async function generateOddOneOutQuestions(
    params: {
        semanticIdeas: SemanticIdeas;
        authorialPersona: AuthorialPersona;
        referenceData: QAReferenceDataSchema[];
        passageText: string;
        count: number;
        personalization?: any;
    },
    costTracker?: CostTracker
) {
    const { semanticIdeas, authorialPersona, referenceData, count, personalization } = params;
    const now = new Date().toISOString();

    const oddOneOutLogger = createChildLogger('odd-one-out');
    oddOneOutLogger.info(`🧩 [Odd One Out] Starting generation (${count} questions)`);

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

    // Force valid standard text to avoid hallucinated sentences in question
    const ODD_ONE_OUT_TEXT = "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: ";

    // Helper to shuffle odd one out
    const shuffleAndFixOddOneOut = (q: any) => {
        // We expect the LLM to put the odd one at "5" based on our new prompt
        // But we will treat valid answers as whatever the LLM says, then shuffle

        const originalSentences = [
            { key: "1", text: q.jumbled_sentences["1"] },
            { key: "2", text: q.jumbled_sentences["2"] },
            { key: "3", text: q.jumbled_sentences["3"] },
            { key: "4", text: q.jumbled_sentences["4"] },
            { key: "5", text: q.jumbled_sentences["5"] }
        ];

        // Identify which one is the odd one based on current answer
        // The answer usually comes as "5" or "1" etc.
        const oddOneIndex = originalSentences.findIndex(s => s.key === q.correct_answer.answer);

        if (oddOneIndex === -1) {
            // If we can't find the answer key, just return as is (shouldn't happen with valid LLM output)
            return {
                ...q,
                question_text: ODD_ONE_OUT_TEXT
            };
        }

        const oddSentenceObj = originalSentences[oddOneIndex];

        // Remove the odd one, then shuffle the rest
        const otherSentences = originalSentences.filter((_, idx) => idx !== oddOneIndex);

        // Fisher-Yates shuffle for the other 4 sentences
        for (let i = otherSentences.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherSentences[i], otherSentences[j]] = [otherSentences[j], otherSentences[i]];
        }

        // Insert the odd one at a random position (0 to 4)
        const newOddIndex = Math.floor(Math.random() * 5);
        otherSentences.splice(newOddIndex, 0, oddSentenceObj);

        // Reconstruct the jumbled_sentences map with fixed keys "1" to "5"
        // The sentences are now in a new order in `otherSentences` array
        const newJumbledMap: Record<string, string> = {};
        let newAnswerKey = "";

        otherSentences.forEach((item, index) => {
            const newKey = String(index + 1);
            newJumbledMap[newKey] = item.text;

            // If this item was the odd one, this is our new answer
            if (item === oddSentenceObj) {
                newAnswerKey = newKey;
            }
        });

        return {
            ...q,
            question_text: ODD_ONE_OUT_TEXT,
            jumbled_sentences: newJumbledMap,
            correct_answer: { answer: newAnswerKey }
        };
    };

    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design odd-one-out questions that test ARGUMENTATIVE CONSISTENCY.

═══════════════════════════════════════════════════════════════════════════════
FUNDAMENTAL TRUTH: CAT VA questions are NOT language exercises. They are LOGIC TESTS.
═══════════════════════════════════════════════════════════════════════════════

CRITICAL MINDSET:
- You are NOT creating simple "find the different category" questions
- You are creating questions that require understanding subtle logical or thematic differences
- The "odd one" should be subtly different, not obviously so
- It must test THEMATIC COHERENCE and SCOPE DISCIPLINE.

---

## CORE COGNITIVE INTENT

Odd One Out questions test:
- Thematic coherence
- Argument consistency
- Scope discipline

They are NOT about topic mismatch alone.

---

USER:
Your task is to generate CAT-style odd-one-out questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `

QUESTIONS:
${rd.questions.slice(0, 2).map((q, j) => `
Q${j + 1}: ${q.question_text}
Jumbled Sentences:
${JSON.stringify(q.jumbled_sentences, null, 2)}

Correct: ${q.correct_answer.answer}

Rationale: ${q.rationale}
`).join("\n")}
`).join("\n---\n")}

These references are your training data. Analyze them to understand:
1) How CAT odd-one-out questions are framed
2) What makes four sentences similar and one different
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
${personalizationInstructions}

---

## GENERATION REQUIREMENTS

Generate ${count} odd-one-out questions based on the semantic ideas and conceptual pairs.

The question should:
- Present 5 jumbled sentences in jumbled_sentences object (keys "1" through "5")
- 4 sentences should share a common theme, logical structure, or conceptual relationship
- 1 sentence (the "odd one") should differ in a subtle but meaningful way
- Use the conceptual_pairs from semantic ideas to create the 4 similar ones
- The difference should be in: tone, logical flow, underlying assumption, or argumentative approach

---

## CRITICAL REQUIREMENT FOR POSITIONING:
- **ALWAYS place the Odd One Out sentence in position 5** (key "5").
- The first 4 sentences (1, 2, 3, 4) MUST form the coherent paragraph.
- (Optimization Note: Our internal system will handle the randomization later. For generation, you MUST standardize by putting the odd one at #5).
- Correct answer should therefore always be "5".

---

## COHERENT GROUP CHARACTERISTICS (4 sentences)

In CAT:
- Four sentences form a tight argumentative unit
- All at same level of abstraction
- All serve same argumentative purpose

---

## ODD SENTENCE CHARACTERISTICS

The odd sentence:
- Is related but misaligned
- Shifts scope, focus, or intent
- Often sounds sophisticated
- Should seem similar at first glance
- Has a subtle but meaningful difference

Common oddity reasons:
- Meta-commentary instead of argument
- Evidence when others are claims
- Different level of abstraction
- Shift in subject or audience

---

## GENERATION PROCESS

Follow this process:
1. First build a coherent paragraph (4 sentences)
2. Then introduce ONE sentence that:
   - Belongs to the topic
   - But not to the argument
3. Ensure odd sentence:
   - Cannot be repositioned to fit
4. Do NOT rely on stylistic difference alone
5. Place the odd sentence in position 5.

---

## FORBIDDEN - Will cause REJECTION

DO NOT:
- Make odd sentence obviously irrelevant
- Change tense or tone as giveaway
- Let odd sentence still fit logically if repositioned
- Base decision on vocabulary difficulty alone

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "",
      "question_text": "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: ",
      "question_type": "odd_one_out",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "jumbled_sentences": {
        "1": "<sentence 1 - coherent>",
        "2": "<sentence 2 - coherent>",
        "3": "<sentence 3 - coherent>",
        "4": "<sentence 4 - coherent>",
        "5": "<sentence 5 - ODD ONE OUT>"
      },
      "correct_answer": { "answer": "5" },
      "rationale": "",
      "difficulty": "easy|medium|hard",
      "tags": [],
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>"
    }
  ]
}

IMPORTANT:
- Fill jumbled_sentences with 5 sentences.
- **ALWAYS put the Odd One Out at key "5".**
- **ALWAYS set correct_answer.answer to "5".**
- Leave options as empty strings for keys A-D
- Leave rationale empty
- Generate EXACTLY ${count} questions
- No additional text or commentary
- The question should be able to assess the metrics from ${user_core_metrics_definition_v1} file.
`;

    oddOneOutLogger.info("⏳ [Odd One Out] Waiting for LLM to generate questions");
    // oddOneOutLogger.debug("Ref Data (First Item):", JSON.stringify(referenceData[0] || {}).substring(0, 500) + "...");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.5,
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

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateVAQuestions[odd_one_out]",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    // Post-processing: Shuffle and Fix Text
    return parsed.questions.map(q => {
        const withTimestamps = { ...q, created_at: now, updated_at: now };
        return shuffleAndFixOddOneOut(withTimestamps);
    });
}
