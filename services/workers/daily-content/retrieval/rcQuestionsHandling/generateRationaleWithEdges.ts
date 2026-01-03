import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates CAT-style rationales using reasoning graphs as a hidden rubric.
 *
 * Design goals:
 * - Force graph-driven elimination (edges/nodes must guide which wrong options get explained)
 * - Avoid leaking prompt scaffolding (no "PART 1", no relationship labels like "requires →")
 * - Keep the output style flexible so the model can emulate PYQ rationale variety
 */

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

function sanitizeRationale(raw: string): string {
    let cleaned = raw;

    // Remove common scaffold headings if they slip into output
    cleaned = cleaned.replace(/^#{2,}\s*PART\s*\d+\s*:\s*.*$/gim, "");
    cleaned = cleaned.replace(/^#{2,}\s*PART\s*\d+\s*.*$/gim, "");
    cleaned = cleaned.replace(
        /^#{2,}\s*(?:MANDATORY RATIONALE STRUCTURE|SYSTEMATIC ELIMINATION|BRIEF MENTION OF REMAINING OPTIONS|CORRECT OPTION EXPLANATION)\s*.*$/gim,
        ""
    );

    // Remove edge-relationship / node-label scaffolding patterns (keep the explanation that follows)
    cleaned = cleaned.replace(
        /^\s*\d+\.?\s*\*\*(?:Requires|Applies|Validates|Misleads_into|Eliminates|Contradicts|Optimizes|Step_of|Supports)\*\*\s*→\s*\*\*?[^:]+\*\*?:\s*/gim,
        ""
    );

    // Remove inline relationship arrow tokens if present
    cleaned = cleaned.replace(
        /\b(?:Requires|Applies|Validates|Misleads_into|Eliminates|Contradicts|Optimizes|Step_of|Supports)\b\s*→\s*/g,
        ""
    );

    // Trim excessive blank lines introduced by heading removal
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
}

export async function generateRationalesWithEdges(params: {
    passageText: string;
    questions: any[];
    reasoningContexts: Record<string, ReasoningGraphContext>;
    referenceData: ReferenceDataSchema[];
}) {
    const { passageText, questions, reasoningContexts, referenceData } = params;

    console.log(`🧾 [Rationales] Generating rationales for ${questions.length} questions`);

    const updatedQuestions = [];

    for (const q of questions) {
        const context = reasoningContexts[q.id];
        if (!context) {
            throw new Error(`Missing reasoning context for question ${q.id}`);
        }

        console.log(
            `🧾 [Rationales] Q${q.id} | primary="${context.primary_node.label}" | edges=${context.edges.length}`
        );

        const prompt = `SYSTEM:
You are a CAT VARC expert mentor.
You teach the elimination process and the thinking errors behind tempting wrong options.

IMPORTANT STYLE RULE:
- Use the reasoning graph as a hidden rubric to choose which wrong options to tackle.
- Do NOT expose the graph.
- Do NOT reproduce labels like "requires →" / "applies →" / node names in the output.
- Do NOT use fixed section headers like "PART 1" / "PART 2". The writing must feel like PYQ rationales.

---

USER:
Write a CAT-style rationale for the TARGET QUESTION.

You are given REFERENCE MATERIAL from actual CAT papers.
Study it to match the usual level of precision, tone, and concision.

---

## REFERENCE MATERIAL (Observe Patterns)

PASSAGE 1 + QUESTIONS + RATIONALES:
${referenceData[0].passage.content}

Questions with Rationales:
${referenceData[0].questions
    .slice(0, 4)
    .map(
        (rq, i) => `
Question ${i + 1}:
${rq.question_text}

Options:
${JSON.stringify(rq.options, null, 2)}

Correct Answer: ${rq.correct_answer.answer}

Rationale:
${rq.rationale}
`
    )
    .join("\n---\n")}

---

PASSAGE 2 + QUESTIONS + RATIONALES:
${referenceData[1].passage.content}

Questions with Rationales:
${referenceData[1].questions
    .slice(0, 4)
    .map(
        (rq, i) => `
Question ${i + 1}:
${rq.question_text}

Options:
${JSON.stringify(rq.options, null, 2)}

Correct Answer: ${rq.correct_answer.answer}

Rationale:
${rq.rationale}
`
    )
    .join("\n---\n")}

---

PASSAGE 3 + QUESTIONS + RATIONALES:
${referenceData[2].passage.content}

Questions with Rationales:
${referenceData[2].questions
    .slice(0, 4)
    .map(
        (rq, i) => `
Question ${i + 1}:
${rq.question_text}

Options:
${JSON.stringify(rq.options, null, 2)}

Correct Answer: ${rq.correct_answer.answer}

Rationale:
${rq.rationale}
`
    )
    .join("\n---\n")}

---

## TARGET QUESTION

PASSAGE:
${passageText}

QUESTION:
${q.question_text}

OPTIONS:
${Object.entries(q.options)
    .map(([key, value]) => `${key}) ${value}`)
    .join("\n")}

CORRECT ANSWER: ${q.correct_answer.answer}

---

## REASONING GRAPH (Hidden Rubric — Do Not Mention or Quote)

Primary reasoning step:
- ${context.primary_node.label}

Elimination cues (use at least TWO of these to eliminate TWO different wrong options):
${context.edges
    .map(
        (e, i) =>
            `${i + 1}. relationship="${e.relationship}", cue="${e.target_node.label}"`
    )
    .join("\n")}

---

## OUTPUT REQUIREMENTS (Must Follow)

1) Explain briefly why the correct option is correct, anchored to the passage.
2) Eliminate at least TWO wrong options in a way that is clearly guided by the elimination cues above.
   - For each eliminated option: state the option letter, why it tempts, what it gets wrong, and where the passage blocks it.
3) Briefly dismiss any remaining option(s) without over-explaining.
4) Use simple words and specifically highlight the part of the passage which solves the questions

Hard constraints:
- Do NOT include the cue list, relationship words, node labels, or any prompt meta-language.
- Do NOT use fixed section headers such as "PART 1" / "SYSTEMATIC ELIMINATION".
- Keep the tone academic and exam-oriented.
- Keep the structure flexible (2–6 short paragraphs OR compact bullets), similar to PYQs.

Output ONLY the rationale text.`;

        console.log(`⏳ [Rationales] Waiting for LLM response for question ${q.id}`);

        const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 0.25,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a CAT VARC expert mentor. You write rationales that teach elimination without exposing internal rubrics.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const rawRationale = completion.choices[0]?.message?.content?.trim();
        if (!rawRationale) {
            throw new Error("Failed to generate rationale");
        }

        const rationale = sanitizeRationale(rawRationale);

        console.log(`✅ [Rationales] Rationale generated for question ${q.id}`);

        updatedQuestions.push({
            ...q,
            rationale,
            tags: [
                context.primary_node.label,
                ...context.edges.map((e) => e.target_node.label),
            ],
            updated_at: new Date().toISOString(),
        });
    }

    console.log("✅ [Rationales] All rationales generated");

    return updatedQuestions;
}
