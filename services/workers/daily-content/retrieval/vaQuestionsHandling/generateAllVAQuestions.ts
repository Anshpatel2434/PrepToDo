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
- You are NOT creating simple restatements or trivial questions
- You are creating questions that require deep understanding and analytical thinking
- Every option must be deliberately designed to test a specific reasoning weakness
- Questions should challenge even well-prepared students

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
- Present a short paragraph (3-5 sentences) derived from semantic ideas
- This paragraph should embody the authorial persona and logical flow
- Ask for the best summary of the paragraph
- There should be no mentioning of the article source or context

**Question text format**: "The passage given below is followed by four alternate summaries. Choose the option that best captures the essence of the passage.\\n\\n<paragraph>"

**Option Design Rules**:
- Correct option (best summary):
  * Captures the main idea without distortion
  * Is concise but comprehensive
  * Avoids adding new information not in the paragraph
- Distractors (wrong options):
  * Too broad/general: goes beyond the paragraph
  * Too narrow: focuses on a detail, missing the main idea
  * Distorts: misrepresents the author's stance or argument
  * Adds external knowledge: brings in information not in the paragraph

**Technical Requirements**:
- Use options: A, B, C, D for summaries
- Set jumbled_sentences to: {"1": "", "2": "", "3": "", "4": "", "5": ""}

---

### 2. PARA_COMPLETION
- Present a paragraph with a missing sentence
- The paragraph should have 4 blank positions marked as ___(1)___, ___(2)___, ___(3)___, ___(4)___
- Provide a sentence that could fit in one of these positions
- Ask which blank position is most appropriate

**Question text format**: "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\\nSentence: <sentence>\\nParagraph: <paragraph with ___(1)___, ___(2)___, ___(3)___, ___(4)___>"

**Option Design Rules**:
- Correct option: The position where the sentence fits most logically
- Distractors: Positions where the sentence would:
  * Break logical flow
  * Create grammatical inconsistency
  * Disrupt chronological/causal order
  * Create redundancy

**Technical Requirements**:
- Options: {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
- Set jumbled_sentences to: {"1": "", "2": "", "3": "", "4": "", "5": ""}

---

### 3. PARA_JUMBLE
- Create 4 sentences that form a coherent paragraph when ordered correctly
- The sentences should be scrambled (not in order 1-2-3-4)
- Each sentence should have clear connectors or logical flow markers

**Question text**: "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer: "

**Sentence Design Rules**:
- Opening sentence: introduces the topic clearly
- Middle sentences: develop the argument with logical connectors
- Closing sentence: concludes or summarizes
- Use pronouns, conjunctions, chronology for clear sequence markers

**Technical Requirements**:
- **CRITICAL: Generate EXACTLY 4 sentences (not 5)**
- **CRITICAL: Sentences MUST be scrambled (not in order 1-2-3-4)**
- Put sentences in jumbled_sentences: {"1": "sentence", "2": "sentence", "3": "sentence", "4": "sentence", "5": ""}
- **IMPORTANT: jumbled_sentences["5"] MUST be empty string ""**
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Correct answer format example: "2413" (4-digit sequence using numbers 1-4 only)

---

### 4. ODD_ONE_OUT
- Create 5 sentences where 4 are coherent and 1 is the odd one
- The odd sentence should seem related but break the logical flow
- The 4 coherent sentences should form a clear argument or narrative

**Question text**: "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: "

**Sentence Design Rules**:
- 4 coherent sentences: should develop a single focused idea
- Odd sentence traps:
  *Related topic but different scope (micro vs macro)
  * Same subject but different time period
  * Similar vocabulary but different stance
  * Tangential idea that seems relevant
- **CRITICAL: The odd sentence must be randomized (not always position 5)**

**Technical Requirements**:
- Put all 5 sentences in jumbled_sentences: {"1": "sentence", "2": "sentence", "3": "sentence", "4": "sentence", "5": "sentence"}
- Leave options empty: {"A": "", "B": "", "C": "", "D": ""}
- Correct answer: number of the odd sentence (1-5)

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
