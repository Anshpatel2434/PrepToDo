// generateAllVAQuestions.ts - Consolidated VA question generation with enhanced prompts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema, SemanticIdeas, AuthorialPersona, Passage } from "../../schemas/types";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";
import { CostTracker } from "../utils/CostTracker";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

// Simple UUID generator
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const AllVAQuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

interface GenerateAllVAQuestionsParams {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}

/**
 * Generates all VA question types in a single batched API call.
 * This consolidates 4 separate API calls into one, reducing token usage significantly.
 * 
 * Generates:
 * - 1 para_summary question
 * - 1 para_completion question
 * - 1 para_jumble question
 * - 1 odd_one_out question
 */
export async function generateAllVAQuestions(
    params: GenerateAllVAQuestionsParams,
    costTracker?: CostTracker
): Promise<Question[]> {
    try {
        console.log(`🧩 [All VA Questions] Starting consolidated generation`);

        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;

        // Reduce reference data to 2 passages (from 3)
        const reducedReferences = referenceData.slice(0, 2);

        // Filter reference data by question type for examples
        const getSummaryRefs = () => reducedReferences
            .flatMap(rd => rd.questions.filter(q => q.question_type === "para_summary"))
            .slice(0, 2);

        const getCompletionRefs = () => reducedReferences
            .flatMap(rd => rd.questions.filter(q => q.question_type === "para_completion"))
            .slice(0, 2);

        const getJumbleRefs = () => reducedReferences
            .flatMap(rd => rd.questions.filter(q => q.question_type === "para_jumble"))
            .slice(0, 2);

        const getOddOneOutRefs = () => reducedReferences
            .flatMap(rd => rd.questions.filter(q => q.question_type === "odd_one_out"))
            .slice(0, 2);

        const summaryRefs = getSummaryRefs();
        const completionRefs = getCompletionRefs();
        const jumbleRefs = getJumbleRefs();
        const oddOneOutRefs = getOddOneOutRefs();

        const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design VA (Verbal Ability) questions that test comprehension, logical coherence, and reasoning skills.

CRITICAL MINDSET:
- CAT VA questions test STRUCTURE, not language
- You are NOT creating simple restatements or trivial questions
- You are creating questions that require understanding of logical flow, discourse coherence, and argument scaffolding
- Every wrong option must fail for a DIFFERENT structural reason
- Questions should challenge even well-prepared students through logical complexity, not grammar

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

These references are your training data. Analyze them to understand:
1) How CAT VA questions are framed
2) How options/sentences are constructed
3) What makes answers correct
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

**Anti-Patterns**: DO NOT let correct option be longest, DO NOT repeat passage vocabulary excessively, DO NOT make all wrong options partially correct

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

**Anti-Patterns**: DO NOT use grammar errors to eliminate options, DO NOT make only one blank "sound right", wrong positions must fail for STRUCTURAL reasons

**Technical Requirements**:
- Options: {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
- Set jumbled_sentences to: {"1": "", "2": "", "3": "", "4": "", "5": ""}

---

### 3. PARA_JUMBLE

**Cognitive Intent**: Tests logical sequencing, idea dependency, argument scaffolding. NOT chronological puzzles.

**Generation Requirements**:
- Create 4 sentences that form a coherent paragraph when ordered correctly
- The sentences should be scrambled (not in order 1-2-3-4)
- Each sentence should have clear connectors or logical flow markers
- Multiple orderings should seem plausible, but only one is truly logical

**Question text**: "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: "

**Critical Jumbling Requirement**:
- The sentences MUST NOT be presented in sequential order (1-2-3-4)
- You MUST randomize the sentence positions so the correct answer is NOT "1234"
- Example: If logical order is A→B→C→D, present as: 1:C, 2:A, 3:D, 4:B (correct answer: "2143")
- Avoid patterns like "1234", "4321", or any obvious sequence
- The correct answer should require careful analysis of logical connections

**Correct Sequence Characteristics**:
CAT para jumbles usually have:
- One sentence that introduces context
- One or two that elaborate
- One that concludes or generalizes

The correct sequence:
- Makes each sentence necessary for the next
- Follows: introduction → development → elaboration → conclusion

Key ordering cues:
- Pronouns require antecedents
- Examples require prior claims
- Conclusions cannot appear early

**Wrong Sequence Design Patterns**:
- Break referent clarity
- Place conclusions prematurely
- Separate example from claim

**Trap Design**: Create traps using thematic similarity and chronological illusion, avoid surface connectors as sole cues

**Sentence Design Rules**:
- Each sentence should be self-contained and meaningful
- Sentences should have logical connectors
- Avoid sentences that can only go in one position (too obvious)
- Create "false starts" that seem logical but lead to dead ends

**Anti-Patterns**: DO NOT make grammar the deciding factor, DO NOT use explicit sequence markers ("first", "finally"), DO NOT allow more than one valid order, DO NOT create independent sentences

**Technical Requirements**:
- **CRITICAL: Generate EXACTLY 4 sentences (not 5)**
- **CRITICAL: Sentences MUST be scrambled (not in order 1-2-3-4)**
- Put sentences in jumbled_sentences: {"1": "sentence", "2": "sentence", "3": "sentence", "4": "sentence", "5": ""}
- **IMPORTANT: jumbled_sentences["5"] MUST be empty string ""**
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Correct answer format example: "2413" (4-digit sequence using numbers 1-4 only)

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

**Critical Randomization Requirement**:
- The odd one out sentence MUST NOT always be in position 5
- You MUST randomize which position (1, 2, 3, 4, or 5) contains the odd sentence
- The 4 coherent sentences should be distributed across the remaining positions
- Avoid the pattern where sentences 1-4 always form a paragraph and 5 is always odd
- Example distributions:
  * Odd one at position 2: sentences 1,3,4,5 form paragraph, 2 is odd
  * Odd one at position 3: sentences 1,2,4,5 form paragraph, 3 is odd
  * Odd one at position 1: sentences 2,3,4,5 form paragraph, 1 is odd
- The correct answer should vary across questions (not always "5")

**Coherent Group Characteristics** (4 sentences):
In CAT:
- Four sentences form tight argumentative unit
- All at same level of abstraction
- All serve same argumentative purpose

Similar sentences should:
- Share a clear common theme or structure
- Be thematically or logically coherent together
- Derive from semantic ideas
- Be RANDOMLY distributed across positions 1-5

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

The difference should be identifiable through careful analysis.
Could differ in: stance, assumption, logical direction, or conclusion.
This sentence should be placed in a RANDOM position (not always position 5).

**Generation Process**:
1. First build a coherent paragraph (4 sentences)
2. Then introduce ONE sentence that:
   - Belongs to the topic
   - But not to the argument
3. Ensure odd sentence:
   - Cannot be repositioned to fit
4. Do NOT rely on stylistic difference alone

**Anti-Patterns**: DO NOT make odd sentence obviously irrelevant, DO NOT change tense/tone as giveaway, DO NOT let odd sentence still fit logically, DO NOT always place in position 5

**Technical Requirements**:
- **CRITICAL: The odd sentence must be randomized (not always position 5)**
- Put all 5 sentences in jumbled_sentences: {"1": "sentence", "2": "sentence", "3": "sentence", "4": "sentence", "5": "sentence"}
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Correct answer: number of the odd sentence (1-5)

---

## GLOBAL VA GENERATION DIRECTIVES

CRITICAL REQUIREMENTS:
1. Mix logical traps — DO NOT reuse the same failure mode across options
2. Ensure wrong options fail for DIFFERENT reasons
3. Avoid grammatical elimination — questions must require logical analysis
4. Preserve CAT-level ambiguity without unfairness
5. Questions must test STRUCTURE, not language

REJECTION CRITERIA:
Any question that:
- Feels solvable by grammar alone
- Repeats the same logic pattern across distractors
- Has predictable correct options (longest, most keywords, etc.)
is NOT CAT-authentic.

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
- Generate EXACTLY 4 questions (one of each type)
- Leave correct_answer.answer empty
- Leave rationale empty
- Leave tags as empty array []
- The metrics should assess skills from ${JSON.stringify(user_core_metrics_definition_v1)}
`;

        console.log("⏳ [All VA Questions] Waiting for LLM to generate all VA questions");

        const completion = await client.chat.completions.parse({
            model: MODEL,
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC examiner with 15+ years of experience. You design VA questions with proper question type discrimination and deep reasoning requirements.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(AllVAQuestionsResponseSchema, "all_va_questions"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed || parsed.questions.length !== 4) {
            throw new Error(`Expected 4 VA questions, got ${parsed?.questions.length || 0}`);
        }

        // Log token usage to cost tracker
        if (costTracker && completion.usage) {
            costTracker.logCall(
                "generateAllVAQuestions",
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            );
        }

        // Verify we have one of each type
        const types = parsed.questions.map(q => q.question_type);
        const expectedTypes = ["para_summary", "para_completion", "para_jumble", "odd_one_out"] as const;
        const hasAllTypes = expectedTypes.every(type => types.includes(type as any));

        if (!hasAllTypes) {
            console.warn("⚠️ [All VA Questions] Missing some question types, retrying...");
            throw new Error("Not all question types generated");
        }

        console.log(`✅ [All VA Questions] Generated 4 questions (${types.join(", ")})`);

        const now = new Date().toISOString();
        const finalQuestions = parsed.questions.map(q => ({
            ...q,
            id: generateUUID(),
            passage_id: "",
            created_at: now,
            updated_at: now,
        }));

        return finalQuestions;

    } catch (error) {
        console.error("❌ [All VA Questions] Error in generateAllVAQuestions:", error);
        throw error;
    }
}
