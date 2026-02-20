// =============================================================================
// Daily Content Worker - Generate All VA Questions
// =============================================================================
// OpenAI-based VA question generation - simplified with updated imports

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, SemanticIdeas, AuthorialPersona } from "../../types";
import { CostTracker } from "../../../../common/utils/CostTracker";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('all-va-questions');
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: any;
    questions: any[];
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const VAQuestionSchema = z.object({
    passage_id: z.string().nullish(), // Can be empty/null
    question_text: z.string(),
    question_type: z.enum(["para_summary", "para_completion", "para_jumble", "odd_one_out"]),
    options: z.object({
        A: z.string(),
        B: z.string(),
        C: z.string(),
        D: z.string(),
    }),
    jumbled_sentences: z.object({
        1: z.string(),
        2: z.string(),
        3: z.string(),
        4: z.string(),
        5: z.string(),
    }),
    correct_answer: z.object({
        answer: z.string()
    }),
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    tags: z.array(z.string()),
});

const AllVAQuestionsResponseSchema = z.object({
    questions: z.array(VAQuestionSchema),
});

interface GenerateAllVAQuestionsParams {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    referenceQuestions: { questions: any[] };
    passageText: string;
}

export async function generateAllVAQuestions(
    params: GenerateAllVAQuestionsParams,
    costTracker?: CostTracker
): Promise<any[]> {
    logger.info(`🧩 [All VA Questions] Starting consolidated generation`);

    const { semanticIdeas, authorialPersona, referenceData, referenceQuestions, passageText } = params;

    // logger.debug("Input Reference Data:", JSON.stringify(referenceData, null, 2));
    // logger.debug("Input Reference Questions:", JSON.stringify(referenceQuestions, null, 2));
    // Force valid standard text to avoid hallucinated sentences in question
    const ODD_ONE_OUT_TEXT = "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: ";
    const PARA_JUMBLE_TEXT = "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: ";

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


    const allRefQuestions = referenceQuestions.questions || [];

    // Filter reference data by question type for examples
    const getSummaryRefs = () => allRefQuestions
        .filter((q: any) => q.question_type === "para_summary")
        .slice(0, 2);

    const getCompletionRefs = () => allRefQuestions
        .filter((q: any) => q.question_type === "para_completion")
        .slice(0, 2);

    const getJumbleRefs = () => allRefQuestions
        .filter((q: any) => q.question_type === "para_jumble")
        .slice(0, 2);

    const getOddOneOutRefs = () => allRefQuestions
        .filter((q: any) => q.question_type === "odd_one_out")
        .slice(0, 2);

    const summaryRefs = getSummaryRefs();
    const completionRefs = getCompletionRefs();
    const jumbleRefs = getJumbleRefs();
    const oddOneOutRefs = getOddOneOutRefs();


    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design VA (Verbal Ability) questions that test STRUCTURE, LOGIC, COHERENCE, and DISCOURSE-STRUCTURE.

═══════════════════════════════════════════════════════════════════════════════
FUNDAMENTAL TRUTH: CAT VA questions are NOT language exercises. They are LOGIC TESTS.
═══════════════════════════════════════════════════════════════════════════════

CRITICAL MINDSET:
- You are NOT creating simple restatements or trivial questions.
- You are creating questions that require understanding of logical flow, discourse coherence, and argument scaffolding.
- Every wrong option must fail for a DIFFERENT structural reason.
- Questions should challenge even well-prepared students through logical complexity, not grammar.

---

USER:
Your task is to generate EXACTLY 4 VA questions (one of each type) based on the semantic ideas provided.

## REFERENCE MATERIAL (Observe Patterns)

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):

${summaryRefs.length > 0 ? `
### PARA_SUMMARY Examples:
${summaryRefs.map((q, i) => `
Example ${i + 1}:
${q.question_text}

Options:
A) ${q.options["A"]}
B) ${q.options["B"]}
C) ${q.options["C"]}
D) ${q.options["D"]}

Correct: ${q.correct_answer.answer}
Rationale: ${q.rationale}
`).join("\n")}
` : ""}

${completionRefs.length > 0 ? `
### PARA_COMPLETION Examples:
${completionRefs.map((q, i) => `
Example ${i + 1}:
${q.question_text}

Options:
A) ${q.options["A"]}
B) ${q.options["B"]}
C) ${q.options["C"]}
D) ${q.options["D"]}

Correct: ${q.correct_answer.answer}
Rationale: ${q.rationale}
`).join("\n")}
` : ""}

${jumbleRefs.length > 0 ? `
### PARA_JUMBLE Examples:
${jumbleRefs.map((q, i) => `
Example ${i + 1}:
${q.question_text}

Scrambled Sentences:
1. ${q.jumbled_sentences["1"]}
2. ${q.jumbled_sentences["2"]}
3. ${q.jumbled_sentences["3"]}
4. ${q.jumbled_sentences["4"]}

Correct Sequence: ${q.correct_answer.answer}
Rationale: ${q.rationale}
`).join("\n")}
` : ""}

${oddOneOutRefs.length > 0 ? `
### ODD_ONE_OUT Examples:
${oddOneOutRefs.map((q, i) => `
Example ${i + 1}:
${q.question_text}

Sentences:
1. ${q.jumbled_sentences["1"]}
2. ${q.jumbled_sentences["2"]}
3. ${q.jumbled_sentences["3"]}
4. ${q.jumbled_sentences["4"]}
5. ${q.jumbled_sentences["5"]}

Odd One: ${q.correct_answer.answer}
Rationale: ${q.rationale}
`).join("\n")}
` : ""}

These references are your training data. DEEPLY STUDY them to understand:
1) How CAT VA questions are framed — your output MUST be indistinguishable from these
2) How options/sentences are constructed — replicate the EXACT style, length, and nuance
3) What makes answers correct — match the reasoning depth of actual CAT papers
4) How distractors are designed to be tempting but incorrect
5) The STYLE and STRUCTURE of questions — NOT the specific topics or subject matter

⚠️ CRITICAL RULE — REFERENCE MATERIAL ISOLATION:
- You MUST NOT bring any topics, examples, arguments, or factual claims from the reference questions into your generated questions.
- The reference material is ONLY for learning the PATTERN of question construction.
- Your questions must be derived EXCLUSIVELY from the SEMANTIC IDEAS and AUTHORIAL PERSONA provided below.
- If any generated content replicates subject matter from the reference, it will be REJECTED.

---

## SEMANTIC IDEAS (DIVERSE INSPIRATION POOL)

<SEMANTIC_IDEAS>
${JSON.stringify(semanticIdeas, null, 2)}
</SEMANTIC_IDEAS>

⚠️ SEMANTIC IDEA USAGE — CREATIVITY & DIVERSITY MANDATE:
- These ideas are a DIVERSE POOL of inspiration — NOT narrow constraints.
- Do NOT fixate on a single semantic idea for multiple questions.
- Each question type MUST draw from a DIFFERENT semantic idea or conceptual pair.
- If you find yourself reusing the same central concept across questions, STOP and diversify.
- The semantic ideas are launching points — sample broadly, show creative breadth, do not cluster.
- You MAY extend beyond the literal ideas — they provide DIRECTION, not boundaries.

## AUTHORIAL PERSONA (STYLE GUIDE ONLY)

<AUTHORIAL_PERSONA>
${JSON.stringify(authorialPersona, null, 2)}
</AUTHORIAL_PERSONA>

This persona guides writing STYLE only — tone, formality, argumentative posture. It does NOT restrict the topic space.

---

## GENERATION REQUIREMENTS

Generate EXACTLY 4 questions, one of each type:

### 1. PARA_SUMMARY

**Cognitive Intent**: Tests ability to identify author's CORE CLAIM (not topic restatement), suppress examples/metaphors, preserve LOGICAL EMPHASIS (not wording).

Summaries are NOT:
❌ Topic restatements
❌ Shortened versions of one paragraph
❌ Emotionally attractive paraphrases

**Generation Requirements**:
- Present a short paragraph (3-5 sentences) derived from semantic ideas
- This paragraph should embody the authorial persona and logical flow
- Ask for the best summary of the paragraph
- There should be no mentioning of the article source or context

**Question text format**: "The passage given below is followed by four alternate summaries. Choose the option that best captures the essence of the passage.\\n\\n<paragraph>"

**Generation Process**:
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

**Correct Option Characteristics**:
- Covers the ENTIRE passage, not just the opening
- Abstracts without generalizing beyond scope
- Avoids verbatim keywords from passage
- Neutral in tone even if passage is emotive
- Captures central tension and authorial stance

**Wrong Option Design Patterns** (each must fail for DIFFERENT reason):
1. TOO NARROW: Captures only one paragraph/detail, misses overarching argument
2. TOO BROAD: Introduces conclusion not reached, generalizes beyond scope
3. EMOTIONALLY EXAGGERATED: Adds moral judgment not in passage, distorts tone
4. REPHRASES EXAMPLES: Focuses on illustrations instead of ideas

**FORBIDDEN - Will cause REJECTION**:
- Correct option is the longest
- Moral judgment words used without author's usage
- Excessive repetition of passage vocabulary
- All wrong options are partially correct (no clear distinction)

**Technical Requirements**:
- Use options: A, B, C, D for summaries
- Set jumbled_sentences to: {"1": "", "2": "", "3": "", "4": "", "5": ""}

---

### 2. PARA_COMPLETION

**Cognitive Intent**: Tests logical flow, discourse continuity, cause-effect sequencing, referent tracking (this, that, such, they). NOT grammar-fill exercises.

CAT para completion relies on:
- Conceptual continuity, not sentence adjacency
- Transitional logic (contrast, continuation, consequence)
- Cohesive devices: pronouns, time markers, logical pivots

**Generation Requirements**:
- Present a paragraph with a missing sentence
- The paragraph should have 4 blank positions marked as ___(1)___, ___(2)___, ___(3)___, ___(4)___
- Provide a sentence that could fit in one of these positions
- Ask which blank position is most appropriate

**Question text format**: "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\\nSentence: <sentence>\\nParagraph: <paragraph with ___(1)___, ___(2)___, ___(3)___, ___(4)___>"

**Generation Process**:
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

**Correct Placement Characteristics**:
- Resolves a logical gap
- Explains or bridges surrounding ideas
- Makes following sentence inevitable
- Maintains conceptual continuity (not just sentence adjacency)

**Wrong Placement Design Patterns** (each must fail for DIFFERENT reason):
1. INTRODUCES CONCEPTS TOO EARLY: Mentions ideas not yet established
2. REPEATS INFORMATION: Restates what was already said, creates redundancy
3. BREAKS CAUSE-EFFECT ORDER: Places effect before cause, disrupts logical progression
4. CREATES REDUNDANCY: Makes surrounding sentences repetitive

**FORBIDDEN - Will cause REJECTION**:
- Grammar errors used to eliminate options
- Only one blank "sounds right" due to grammar
- Multiple genuinely plausible placements exist
- Discourse markers ignored in design

**Technical Requirements**:
- Options: {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
- Set jumbled_sentences to: {"1": "", "2": "", "3": "", "4": "", "5": ""}
- Question Text: "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\\nSentence: <sentence>\\nParagraph: <paragraph with blanks ___(1)___, ___(2)___, ___(3)___, ___(4)___>"
- Set correct_answer.answer to "(The correct option from A,B,C or D here)"

---

### 3. PARA_JUMBLE

**Cognitive Intent**: Tests logical sequencing, idea dependency, argument scaffolding. NOT chronological puzzles.

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
❌ introduces transition word
❌ introduces prior situation
❌ introduces prior mention of approach
❌ introduces prior reasoning
❌ introduces prior studies mentioned

═══════════════════════════════════════════════════════════════════════════════

**Generation Requirements**:
- Create 4 sentences that form a coherent paragraph when ordered correctly
- ⚠️ GENERATE SENTENCES IN THEIR CORRECT LOGICAL ORDER (1=opening, 2=second, 3=third, 4=closing)
- Do NOT scramble the sentences — our system will handle shuffling automatically
- Each sentence should have clear connectors or logical flow markers
- Multiple orderings should seem plausible, but only one is truly logical

**Question text**: "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: "
(The four sentences should not be added in the question text)

**IMPORTANT — Generate In Correct Order**:
- Sentence 1 MUST be the logical OPENING sentence
- Sentence 2 MUST be the logical SECOND sentence
- Sentence 3 MUST be the logical THIRD sentence
- Sentence 4 MUST be the logical CLOSING sentence
- Set correct_answer.answer to "1234" (our system will shuffle and update this)

**True Structure of CAT Para Jumbles**:
- One sentence that introduces context (STANDALONE - no transition words at start)
- One or two that elaborate (may use transitions like "This", "However")
- One that concludes or generalizes

**Generation Process**:
1. Write the OPENING sentence FIRST (sentence 1) - verify it starts with a noun, verb, or descriptive phrase (NOT a transition)
2. Write the CLOSING sentence (sentence 4) - should provide insight or implication
3. Write 2 MIDDLE sentences (sentences 2 and 3) - these CAN use transitions like "This", "However", "Moreover"
4. Place them in order: 1=opening, 2=second, 3=third, 4=closing
5. Verify: Can a test-taker identify the opener by elimination? (transition words = NOT opener)

**Correct Sequence Characteristics**:
- Makes each sentence necessary for the next
- Follows: introduction → development → elaboration → conclusion
- Pronouns require antecedents
- Examples require prior claims
- Conclusions cannot appear early

**Wrong Sequence Design Patterns**:
- Break referent clarity
- Place conclusions prematurely
- Separate example from claim

**Trap Design**: Create traps using thematic similarity and chronological illusion

**MANDATORY VERIFICATION CHECKLIST (before finalizing)**:
□ First sentence (sentence 1) does NOT start with However/Thus/Therefore/This/That/Moreover/etc.
□ First sentence introduces context WITHOUT requiring prior information
□ Sentences are in CORRECT LOGICAL ORDER (1=opening, 4=closing)
□ Each sentence depends on at least one other
□ Only ONE valid ordering exists

**FORBIDDEN - Will cause REJECTION**:
- First sentence of correct sequence starts with a transition word
- Grammar is the deciding factor for ordering
- Explicit sequence markers used ("first", "second", "finally")
- More than one valid ordering exists
- Sentences are independent (can stand alone without others)

**Technical Requirements**:
- **CRITICAL: Generate EXACTLY 4 sentences (not 5)**
- **CRITICAL: Sentences MUST be in CORRECT LOGICAL ORDER (1=opening, 4=closing)**
- Put sentences in jumbled_sentences: {"1": "opening sentence", "2": "second sentence", "3": "third sentence", "4": "closing sentence", "5": ""}
- **IMPORTANT: jumbled_sentences["5"] MUST be empty string ""**
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Set correct_answer.answer to "1234" (system will shuffle automatically)

---

### 4. ODD_ONE_OUT

**Cognitive Intent**: Tests thematic coherence, argument consistency, scope discipline. NOT about topic mismatch alone.

**Generation Requirements**:
- Create 5 sentences where 4 are coherent and 1 is the odd one
- The odd sentence should seem related but break the logical flow
- The 4 coherent sentences should form a clear argument or narrative
- Use the conceptual_pairs from semantic ideas to create the 4 similar ones
- The difference should be in: tone, logical flow, underlying assumption, or argumentative approach

**Question text**: "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: "
(The five sentences should not be added in the question text)

**Critical Randomization Requirement**:
- **ALWAYS place the Odd One Out sentence in position 5** (key "5").
- The first 4 sentences (1, 2, 3, 4) MUST form the coherent paragraph.
- (Optimization Note: Our internal system will handle the randomization later. For generation, you MUST standardize by putting the odd at #5).
- Correct answer should therefore always be "5".

**Coherent Group Characteristics** (4 sentences):
In CAT:
- Four sentences form tight argumentative unit
- All at same level of abstraction
- All serve same argumentative purpose

**Odd Sentence Characteristics**:
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

**Generation Process**:
1. First build a coherent paragraph (4 sentences)
2. Then introduce ONE sentence that:
   - Belongs to the topic
   - But not to the argument
3. Ensure odd sentence:
   - Cannot be repositioned to fit
4. Do NOT rely on stylistic difference alone
5. Place the odd sentence in position 5.

**FORBIDDEN - Will cause REJECTION**:
- Odd sentence is obviously irrelevant
- Tense or tone change is the giveaway
- Odd sentence could logically fit if repositioned
- Base decision on vocabulary difficulty alone

**Technical Requirements**:
- **CRITICAL: Put odd sentence at key "5"**
- Put all 5 sentences in jumbled_sentences: {"1": "sentence", "2": "sentence", "3": "sentence", "4": "sentence", "5": "sentence"}
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Set correct_answer.answer to "5"

---

## GLOBAL VA GENERATION DIRECTIVES

CRITICAL REQUIREMENTS:
1. Mix logical traps — DO NOT reuse the same failure mode across options
2. Ensure wrong options fail for DIFFERENT reasons
3. Avoid grammatical elimination — questions must require logical analysis
4. Preserve CAT-level ambiguity without unfairness
5. Questions must test STRUCTURE, not language

REJECTION CRITERIA - Question is NOT CAT-authentic if:
- Feels solvable by grammar alone
- Repeats the same logic pattern across distractors
- Has predictable correct options (longest, most keywords, etc.)
- Para jumble opener starts with transition word
- Odd one out is always in position 5

---

## OUTPUT FORMAT

Return STRICT JSON in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "",
      "question_text": "<text>",
      "question_type": "para_summary|para_completion|para_jumble|odd_one_out",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "jumbled_sentences": { "1": "...", "2": "...", "3": "...", "4": "...", "5": "..." },
      "correct_answer": { "answer": "A" },
      "rationale": "",
      "difficulty": "easy|medium|hard",
      "tags": [],
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>"
    }
  ]
}

IMPORTANT:
- Generate EXACTLY 4 questions (one of each type)
- Fill correct_answer.answer with the correct option letter (A, B, C, D) or sequence string ("1234", "5")
- Leave rationale empty
- Leave tags as empty array []
- The metrics should assess skills from ${JSON.stringify(user_core_metrics_definition_v1)}
`;

    logger.info("⏳ [All VA Questions] Waiting for LLM response");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.4,
        messages: [
            { role: "system", content: "You are a CAT VARC examiner." },
            { role: "user", content: prompt },
        ],
        response_format: zodResponseFormat(AllVAQuestionsResponseSchema, "all_va_questions"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questions.length !== 4) {
        throw new Error(`Expected 4 VA questions, got ${parsed?.questions.length || 0}`);
    }

    if (costTracker && completion.usage) {
        costTracker.logCall("generateAllVAQuestions", completion.usage.prompt_tokens, completion.usage.completion_tokens);
    }

    // Verify we have one of each type
    const types = parsed.questions.map(q => q.question_type);
    const expectedTypes = ["para_summary", "para_completion", "para_jumble", "odd_one_out"] as const;
    const hasAllTypes = expectedTypes.every(type => types.includes(type as any));

    if (!hasAllTypes) {
        logger.warn({ types }, "Missing some question types, retrying...");
        throw new Error("Not all question types generated");
    }

    logger.info(`✅ [All VA Questions] Generated 4 questions (${types.join(", ")})`);

    const now = new Date().toISOString();
    const finalQuestions = parsed.questions.map(q => ({
        ...q,
        id: generateUUID(),
        passage_id: "",
        created_at: now,
        updated_at: now,
    }));

    return finalQuestions.map(q => {
        if (q.question_type === 'odd_one_out') {
            return shuffleAndFixOddOneOut(q);
        }
        if (q.question_type === 'para_jumble') {
            // Shuffle the sentences that were generated in correct order
            const sentences = [
                { originalPos: 1, text: q.jumbled_sentences["1"] },
                { originalPos: 2, text: q.jumbled_sentences["2"] },
                { originalPos: 3, text: q.jumbled_sentences["3"] },
                { originalPos: 4, text: q.jumbled_sentences["4"] },
            ];
            // Fisher-Yates shuffle
            for (let i = sentences.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
            }
            // Ensure not still in order 1234
            const isStillInOrder = sentences.every((s, idx) => s.originalPos === idx + 1);
            if (isStillInOrder) {
                // Swap first two to break the order
                [sentences[0], sentences[1]] = [sentences[1], sentences[0]];
            }
            // Build new jumbled_sentences map and correct answer
            const newJumbled: Record<string, string> = { "5": "" };
            // The correct answer is: for each position in the correct order (1,2,3,4),
            // find which new label it got
            const correctOrderMap: Record<number, number> = {}; // originalPos -> newLabel
            sentences.forEach((s, idx) => {
                const newLabel = idx + 1;
                newJumbled[String(newLabel)] = s.text;
                correctOrderMap[s.originalPos] = newLabel;
            });
            // Answer is the sequence of new labels in correct reading order
            const answer = [1, 2, 3, 4].map(pos => String(correctOrderMap[pos])).join("");
            return {
                ...q,
                question_text: PARA_JUMBLE_TEXT,
                jumbled_sentences: newJumbled,
                correct_answer: { answer },
            };
        }
        return q;
    });
}
