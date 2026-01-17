// generateVAQuestions.ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionSchema, Passage, SemanticIdeas, AuthorialPersona } from "../../schemas/types";

// Simple UUID generator to avoid additional dependencies
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
export async function generateVAQuestions(params: GenerateVAQuestionsParams) {
    try {
        const { semanticIdeas, authorialPersona, referenceData, passageText, questionDistribution, personalization } = params;

        // Set default distribution
        const distribution = questionDistribution || {
            para_summary: 1,
            para_completion: 1,
            para_jumble: 1,
            odd_one_out: 1,
        };

        console.log(`🧩 [VA Questions] Starting generation`);
        console.log(`   Distribution:`, distribution);

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
        if (distribution.para_summary && distribution.para_summary > 0 && summaryReferences.length > 0 && semanticIdeas.sentence_ideas.length >= 3) {
            try {
                const summaryQuestions = await generateParaSummaryQuestions({
                    semanticIdeas,
                    authorialPersona,
                    referenceData: summaryReferences,
                    passageText,
                    count: distribution.para_summary,
                    personalization
                });
                allQuestions.push(...summaryQuestions);
                console.log(`✅ [VA Questions] Generated ${summaryQuestions.length} para_summary questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_summary:", error);
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
                });
                allQuestions.push(...completionQuestions);
                console.log(`✅ [VA Questions] Generated ${completionQuestions.length} para_completion questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_completion:", error);
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
                });
                allQuestions.push(...jumbleQuestions);
                console.log(`✅ [VA Questions] Generated ${jumbleQuestions.length} para_jumble questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate para_jumble:", error);
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
                });
                allQuestions.push(...oddOneOutQuestions);
                console.log(`✅ [VA Questions] Generated ${oddOneOutQuestions.length} odd_one_out questions`);
            } catch (error) {
                console.error("❌ [VA Questions] Failed to generate odd_one_out:", error);
            }
        }

        console.log(`✅ [VA Questions] Total VA questions generated: ${allQuestions.length}`);

        // Final pass to ensure all questions have fresh UUIDs
        const finalQuestions = allQuestions.map(q => ({
            ...q,
            id: generateUUID(),
            passage_id: "", // VA questions are standalone
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
    count: number;
    personalization?: any;
}) {
    const { semanticIdeas, authorialPersona, referenceData, passageText, count, personalization } = params;
    const now = new Date().toISOString();

    console.log(`🧩 [Para Summary] Starting generation (${count} questions)`);

    let personalizationInstructions = "";
    if (personalization) {
        if (personalization.targetMetrics && personalization.targetMetrics.length > 0) {
            personalizationInstructions = `\n\nPERSONALIZATION: Target these metrics - ${personalization.targetMetrics.join(", ")}`;
        }
    }

    const prompt = `SYSTEM:
You are a CAT VARC examiner with 15+ years of experience.
You design para-summary questions that test comprehension and synthesis skills.

CRITICAL MINDSET:
- You are NOT creating simple restatements
- You are creating questions that require understanding core message
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
      "passage_id": "",
      "question_text": "The passage given below is followed by four alternate summaries. Choose option that best captures essence of the passage. \\n\\n<paragraph derived from semantic ideas>",
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
}

/**
 * Generates para_completion questions
 */
async function generateParaCompletionQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
    count: number;
    personalization?: any;
}) {
    const { semanticIdeas, authorialPersona, referenceData, passageText, count } = params;
    const now = new Date().toISOString();

    console.log(`🧩 [Para Completion] Starting generation (${count} questions)`);

    // Simplified prompt for brevity - similar structure to para_summary
    const prompt = `Generate ${count} CAT-style para-completion question(s) based on semantic ideas and authorial persona.

SEMANTIC IDEAS:
${JSON.stringify(semanticIdeas, null, 2)}

AUTHORIAL PERSONA:
${JSON.stringify(authorialPersona, null, 2)}

REFERENCE MATERIAL:
${referenceData.slice(0, 2).map(rd => rd.passage.content).join("\n\n---\n\n")}

Each question should have:
- A sentence that was removed from a paragraph
- A paragraph with 4 blanks marked as ___(1)___, ___(2)___, ___(3)___, ___(4)___
- Question text format: "There is a sentence that is missing in the paragraph below. Look at paragraph and decide in which blank (option 1, 2, 3, or 4) following sentence would best fit.\\nSentence: [sentence]\\nParagraph: [paragraph with blanks]"
- Options A, B, C, D correspond to blank 1, 2, 3, 4

Return STRICT JSON with ${count} question(s), question_type "para_completion", empty correct_answer and rationale.
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

    return parsed.questions.map(q => ({ ...q, created_at: now, updated_at: now }));
}

/**
 * Generates para_jumble questions
 */
async function generateParaJumbleQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
    count: number;
    personalization?: any;
}) {
    const { semanticIdeas, authorialPersona, referenceData, count } = params;
    const now = new Date().toISOString();

    console.log(`🧩 [Para Jumble] Starting generation (${count} questions)`);

    const prompt = `Generate ${count} CAT-style para-jumble question(s) based on semantic ideas and authorial persona.

SEMANTIC IDEAS:
${JSON.stringify(semanticIdeas, null, 2)}

Sentence ideas: ${semanticIdeas.sentence_ideas.join(", ")}

Each question should:
- Have 5 jumbled sentences related to the semantic ideas
- Question text should ask user to arrange sentences in correct order
- jumbled_sentences field should contain the 5 sentences with keys "1", "2", "3", "4", "5"
- Options A, B, C, D should be different orderings (e.g., "ABDEC", "BCADE", etc.)

Return STRICT JSON with ${count} question(s), question_type "para_jumble", populated jumbled_sentences and options, empty correct_answer and rationale.
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

    return parsed.questions.map(q => ({ ...q, created_at: now, updated_at: now }));
}

/**
 * Generates odd_one_out questions
 */
async function generateOddOneOutQuestions(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referenceData: ReferenceDataSchema[];
    passageText: string;
    count: number;
    personalization?: any;
}) {
    const { semanticIdeas, count } = params;
    const now = new Date().toISOString();

    console.log(`🧩 [Odd One Out] Starting generation (${count} questions)`);

    const prompt = `Generate ${count} CAT-style odd_one_out question(s) based on semantic ideas.

SEMANTIC IDEAS:
${JSON.stringify(semanticIdeas, null, 2)}

Conceptual pairs: ${semanticIdeas.conceptual_pairs.map(p => `${p.idea_a} - ${p.idea_b} (${p.relationship})`).join(", ")}

Each question should:
- Present 4 options where 3 share a common theme/logic and 1 is different
- The different option is the correct answer
- Options should be in A, B, C, D format
- jumbled_sentences field should be empty

Return STRICT JSON with ${count} question(s), question_type "odd_one_out", populated options, empty jumbled_sentences, empty correct_answer and rationale.
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
        throw new Error("Invalid odd_one_out question generation output");
    }

    return parsed.questions.map(q => ({ ...q, created_at: now, updated_at: now }));
}
