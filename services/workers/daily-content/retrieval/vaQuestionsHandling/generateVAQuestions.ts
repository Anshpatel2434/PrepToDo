// generateVAQuestions.ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema, Passage, SemanticIdeas, AuthorialPersona } from "../../schemas/types";

// Simple UUID generator to avoid additional dependencies
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

interface GenerateVAQuestionsParams {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}

const VAQuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

/**
 * Generates all VA question types: para_summary, para_completion, para_jumble, odd_one_out
 * Each type uses its own prompt with reference PYQs for pattern learning
 */
export async function generateVAQuestions(params: GenerateVAQuestionsParams) {
    try {
        console.log(`🧩 [VA Questions] Starting generation`);

        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;

        // Filter reference data by question type
        const summaryReferences = referenceData
            .filter(rd => rd.questions.some(q => q.question_type === "para_summary"))
            .map(rd => ({
                passage: rd.passage,
                questions: rd.questions.filter(q => q.question_type === "para_summary").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);

        const completionReferences = referenceData
            .filter(rd => rd.questions.some(q => q.question_type === "para_completion"))
            .map(rd => ({
                passage: rd.passage,
                questions: rd.questions.filter(q => q.question_type === "para_completion").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);

        const jumbleReferences = referenceData
            .filter(rd => rd.questions.some(q => q.question_type === "para_jumble"))
            .map(rd => ({
                passage: rd.passage,
                questions: rd.questions.filter(q => q.question_type === "para_jumble").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);

        const oddOneOutReferences = referenceData
            .filter(rd => rd.questions.some(q => q.question_type === "odd_one_out"))
            .map(rd => ({
                passage: rd.passage,
                questions: rd.questions.filter(q => q.question_type === "odd_one_out").slice(0, 5)
            }))
            .filter(rd => rd.questions.length > 0);

        const allQuestions: Question[] = [];
        const now = new Date().toISOString();

        // Generate para_summary questions
        if (summaryReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 3) {
            try {
                const summaryQuestions = await generateParaSummaryQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: summaryReferences,
                    passageText
                });
                allQuestions.push(...summaryQuestions);
                console.log(`✅ [VA Questions] Generated ${summaryQuestions.length} para_summary questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_summary:", error);
                // Continue with other question types
            }
        }

        // Generate para_completion questions
        if (completionReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 4) {
            try {
                const completionQuestions = await generateParaCompletionQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: completionReferences,
                    passageText
                });
                allQuestions.push(...completionQuestions);
                console.log(`✅ [VA Questions] Generated ${completionQuestions.length} para_completion questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_completion:", error);
                // Continue with other question types
            }
        }

        // Generate para_jumble questions
        if (jumbleReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 4) {
            try {
                const jumbleQuestions = await generateParaJumbleQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: jumbleReferences,
                    passageText
                });
                allQuestions.push(...jumbleQuestions);
                console.log(`✅ [VA Questions] Generated ${jumbleQuestions.length} para_jumble questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_jumble:", error);
                // Continue with other question types
            }
        }

        // Generate odd_one_out questions
        if (oddOneOutReferences.length > 0 && semanticIdeas.conceptual_pairs.length >= 3) {
            try {
                const oddOneOutQuestions = await generateOddOneOutQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: oddOneOutReferences,
                    passageText
                });
                allQuestions.push(...oddOneOutQuestions);
                console.log(`✅ [VA Questions] Generated ${oddOneOutQuestions.length} odd_one_out questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate odd_one_out:", error);
                // Continue with other question types
            }
        }

        console.log(`✅ [VA Questions] Total VA questions generated: ${allQuestions.length}`);
        
        // Final pass to ensure all questions have fresh UUIDs
        const finalQuestions = allQuestions.map(q => ({
            ...q,
            id: generateUUID(),
            passage_id: generateUUID(), // New UUID to avoid linking to any real passage
            created_at: now,
            updated_at: now
        }));

        console.log("✅ [VA Questions] Finalized VA questions with fresh IDs");
        return finalQuestions;
    } catch (error) {
        console.error("❌ [VA Questions] Error in generateVAQuestions:", error);
        throw error;
    }
}

/**
 * Generates para_summary questions
 */
async function generateParaSummaryQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}) {
    try {
        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;
        const now = new Date().toISOString();

        console.log(`🧩 [Para Summary] Starting generation`);

        const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design para-summary questions that test comprehension and synthesis skills.

CRITICAL MINDSET:
- You are NOT creating simple restatements
- You are creating questions that require understanding the core message
- Every option must be deliberately designed to test a specific reasoning weakness

---

USER:
Your task is to generate CAT-style para-summary questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `
PASSAGE ${i + 1}:
${rd.passage.content}

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

---

## GENERATION REQUIREMENTS

Generate 1 para-summary question based on the semantic ideas and authorial persona.

The question should:
- Present a short paragraph (3-5 sentences) derived from the semantic ideas
- This paragraph should embody the authorial persona and logical flow
- Ask for the best summary of the paragraph

---

## OPTION DESIGN RULES

Correct option (best summary):
- Captures the main idea without distortion
- Is concise but comprehensive
- Avoids adding new information not in the paragraph

Distractors (wrong options):
- Too broad/general: goes beyond the paragraph
- Too narrow: focuses on a detail, missing the main idea
- Distorts: misrepresents the author's stance or argument
- Adds external knowledge: brings in information not in the paragraph

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "<UUID>",
      "question_text": "The passage given below is followed by four alternate summaries. Choose the option that best captures the essence of the passage. \\n\\n<paragraph derived from semantic ideas>",
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
- Generate EXACTLY 1 question
- No additional text or commentary
`;

        console.log("⏳ [Para Summary] Waiting for LLM to generate questions");

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
            throw new Error("Invalid para-summary question generation output");
        }

        console.log(`✅ [Para Summary] Generated ${parsed.questions.length} questions`);

        return parsed.questions.map(q => ({
            ...q,
            created_at: now,
            updated_at: now,
        }));

    } catch (error) {
        console.error("❌ [Para Summary] Error generating questions:", error);
        throw error;
    }
}

/**
 * Generates para_completion questions
 */
async function generateParaCompletionQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}) {
    try {
        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;
        const now = new Date().toISOString();

        console.log(`🧩 [Para Completion] Starting generation`);

        const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design para-completion questions that test understanding of logical flow and coherence.

CRITICAL MINDSET:
- You are NOT creating simple fill-in-the-blank exercises
- You are creating questions that require understanding the argument's direction
- Every option must be deliberately designed to test a specific reasoning weakness

---

USER:
Your task is to generate CAT-style para-completion questions.

You are given REFERENCE MATERIAL from actual CAT papers (PYQs):
${referenceData.slice(0, 3).map((rd, i) => `
PASSAGE ${i + 1}:
${rd.passage.content}

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

Generate 1 para-completion question based on the semantic ideas and authorial persona.

The question should follow this exact format:
1. "Sentence": A single sentence that has been removed from a paragraph.
2. "Paragraph": A paragraph (4-5 sentences) where the sentence was removed from, with 4 possible blanks marked as ___(1)___, ___(2)___, ___(3)___, and ___(4)___.

The question text should be:
"There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\nSentence: [The missing sentence]\nParagraph: [The paragraph with blanks]"

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
      "passage_id": "<UUID>",
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
- Generate EXACTLY 1 question
- No additional text or commentary
`;

        console.log("⏳ [Para Completion] Waiting for LLM to generate questions");

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
            throw new Error("Invalid para-completion question generation output");
        }

        console.log(`✅ [Para Completion] Generated ${parsed.questions.length} questions`);

        return parsed.questions.map(q => ({
            ...q,
            created_at: now,
            updated_at: now,
        }));

    } catch (error) {
        console.error("❌ [Para Completion] Error generating questions:", error);
        throw error;
    }
}

/**
 * Generates para_jumble questions
 */
async function generateParaJumbleQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
}) {
    try {
        const { semanticIdeas, authorialPersona, referenceData, passageText } = params;
        const now = new Date().toISOString();

        console.log(`🧩 [Para Jumble] Starting generation`);

        const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design para-jumble questions that test understanding of logical flow and coherence.

CRITICAL MINDSET:
- You are NOT creating simple ordering exercises
- You are creating questions that require understanding logical connections
- The sentences must have meaningful but non-obvious connections

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

Generate 1 para-jumble question based on the semantic ideas and authorial persona.

The question should:
- Present 4 sentences that can form a coherent paragraph
- Sentences should use the semantic ideas and logical transitions
- The correct ordering should create a logical argument or narrative flow
- Multiple orderings should seem plausible, but only one is truly logical

---

## SENTENCE DESIGN RULES

- Each sentence should be self-contained and meaningful
- Sentences should have logical connectors (from semantic_ideas.logical_transitions)
- The correct order should follow: introduction → development → elaboration → conclusion
- Avoid sentences that can only go in one position (too obvious)
- Create "false starts" that seem logical but lead to dead ends

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "questions": [
    {
      "id": "<UUID>",
      "passage_id": "<UUID>",
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
- Fill jumbled_sentences with the 4 sentences in keys 1-4, leave key 5 as empty string
- Leave options as empty strings for keys A-D
- Leave correct_answer.answer empty
- Leave rationale empty
- Generate EXACTLY 1 question
- No additional text or commentary
`;

        console.log("⏳ [Para Jumble] Waiting for LLM to generate questions");

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
            throw new Error("Invalid para-jumble question generation output");
        }

        console.log(`✅ [Para Jumble] Generated ${parsed.questions.length} questions`);

        return parsed.questions.map(q => ({
            ...q,
            created_at: now,
            updated_at: now,
        }));

    } catch (error) {
        console.error("❌ [Para Jumble] Error generating questions:", error);
        throw error;
    }
}

/**
 * Generates odd_one_out questions
 */
async function generateOddOneOutQuestions(params: {
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
      "passage_id": "<UUID>",
      "question_text": "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of the sentence as your answer: ",
      "question_type": "odd_one_out",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "jumbled_sentences": {
        "1": "<sentence 1>",
        "2": "<sentence 2>",
        "3": "<sentence 3>",
        "4": "<sentence 4>",
        "5": "<sentence 5>"
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
- Fill jumbled_sentences with 5 sentences in ANY order (4 that form a paragraph + 1 odd one out)
- Leave options as empty strings for keys A-D
- Leave correct_answer.answer empty
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
