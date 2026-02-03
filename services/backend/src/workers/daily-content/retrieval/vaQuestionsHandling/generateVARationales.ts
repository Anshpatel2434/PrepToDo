// generateVARationales.ts
import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

/**
 * Generates CAT-style rationales for VA questions using reasoning graphs as a hidden rubric.
 *
 * Design goals:
 * - Force graph-driven elimination (edges/nodes must guide which wrong options get explained)
 * - Avoid leaking prompt scaffolding (no "PART 1", no relationship labels like "requires →")
 * - Keep the output style flexible so the model can emulate PYQ rationale variety
 */

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

export async function generateVARationalesWithEdges(params: {
    questions: any[];
    reasoningContexts: Record<string, ReasoningGraphContext>;
    referenceData: ReferenceDataSchema[];
}) {
    try {
        const { questions, reasoningContexts, referenceData } = params;

        console.log(`🧾 [VA Rationales] Generating rationales for ${questions.length} questions`);

        const updatedQuestions = [];

        for (const q of questions) {
            try {
                const context = reasoningContexts[q.id];
                if (!context) {
                    console.warn(`⚠️ [VA Rationales] Missing reasoning context for question ${q.id}, skipping rationale generation`);
                    updatedQuestions.push({ ...q, rationale: "Rationale generation skipped - missing reasoning context." });
                    continue;
                }

                console.log(
                    `🧾 [VA Rationales] Q${q.id} | metrics="${context.metric_keys.join(", ")}" | nodes=${context.nodes.length} | edges=${context.edges.length}`
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

Questions with Rationales (similar question type: ${q.question_type}):
${referenceData[0].questions
    .filter(rq => rq.question_type === q.question_type && q.question_type !== "rc_question")
    .slice(0, 3)
    .map(
        (rq, i) => `
Question ${i + 1}:
${rq.question_text}

${rq.question_type === "para_jumble" || rq.question_type === "odd_one_out" ? `Jumbled Sentences:\n${JSON.stringify(rq.jumbled_sentences, null, 2)}` : `Options:\n${JSON.stringify(rq.options, null, 2)}`}

Correct Answer: ${rq.correct_answer.answer}

Rationale:
${rq.rationale}
`
    )
    .join("\n---\n")}

---

## TARGET QUESTION

QUESTION TYPE: ${q.question_type}

${q.question_type === "para_jumble" || q.question_type === "odd_one_out"
    ? `QUESTION: ${q.question_text}

Jumbled Sentences:
${JSON.stringify(q.jumbled_sentences, null, 2)}

CORRECT ANSWER: ${q.correct_answer.answer}`
    : `QUESTION: ${q.question_text}

OPTIONS:
${q.options ? Object.entries(q.options).map(([key, value]) => `${key}) ${value}`).join("\n") : "None"}

CORRECT ANSWER: ${q.correct_answer.answer}`
}

---

## REASONING GRAPH (Hidden Rubric — Do Not Mention or Quote)

Core Metrics:
${context.metric_keys.map(k => `- ${k}`).join("\n")}

Reasoning steps involved:
${context.nodes.map(n => `- ${n.label}: ${n.justification}`).join("\n")}

Elimination cues (use at least TWO of these to eliminate TWO different wrong options):
${context.edges
    .map(
        (e, i) =>
            `${i + 1}. relationship="${e.relationship}", from="${e.source_node_label}", cue="${e.target_node_label}"`
    )
    .join("\n")}
---

## OUTPUT REQUIREMENTS (Must Follow)

${q.question_type === "para_jumble" ? `
1) Identify the "Anchor": Explain the Mandatory Pair (two sentences that must stay together) or the starting sentence, citing specific keywords (pronouns, conjunctions, or chronology).
2) Explain wrong sequences: 
   - The Trap: Why the flow seems okay initially (e.g., "Sentence 1 and 2 share a keyword").
   - The Flaw: The specific "logical break" (e.g., "Sentence 3 introduces an acronym that wasn't defined until Sentence 4").
3) Briefly dismiss other sequences: Point out one structural error (e.g., "Sequence starts with a concluding transition").
4) The "Golden Key": Highlight the specific **connector word** (e.g., **"However," "This," "Thus"**) that locks the order.
` : q.question_type === "odd_one_out" ? `
1) Define the "Common Thread": Briefly state the specific theme or logical structure that connects four of the sentences.
2) Eliminate TWO "Trap" sentences: 
   - Option: State the sentence letter/number.
   - The Trap: Why it feels like it belongs (e.g., "It uses the same subject matter/vocabulary").
   - The Connection: Explain exactly how it fits into the main group's logic.
3) Briefly dismiss the remaining fit: State why it is safely part of the group.
4) The "Misfit" Factor: Highlight the specific **word or scope shift** that makes the odd sentence different (e.g., **"Personal opinion vs. General facts"**).
` : `
1) Explain briefly why the correct option is correct, anchored to the logic/passage.
2) Eliminate at least TWO wrong options in a way that is clearly guided by the elimination cues above.
   - For each eliminated option: state the option letter, why it tempts, what it gets wrong.
3) Briefly dismiss any remaining option(s) without over-explaining.
4) Use simple words and specifically highlight the part of the question which just solves the questions.
`}

Hard constraints:
- Do NOT include the cue list, relationship words, node labels, or any prompt meta-language.
- Do NOT use fixed section headers such as "PART 1" / "SYSTEMATIC ELIMINATION".
- Keep the tone academic and exam-oriented.
- Keep the structure flexible (2–6 short paragraphs OR compact bullets), similar to PYQs.

Output ONLY the rationale text.`;

                console.log(`⏳ [VA Rationales] Waiting for LLM response for question ${q.id}`);

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
                    console.warn(`⚠️ [VA Rationales] Failed to generate rationale for question ${q.id}`);
                    updatedQuestions.push({ ...q, rationale: "Rationale generation failed." });
                    continue;
                }

                const rationale = sanitizeRationale(rawRationale);

                console.log(`✅ [VA Rationales] Rationale generated for question ${q.id}`);

                updatedQuestions.push({
                    ...q,
                    rationale,
                    tags: context.metric_keys,
                    updated_at: new Date().toISOString(),
                });
            } catch (error) {
                console.error(`❌ [VA Rationales] Error generating rationale for question ${q.id}:`, error);
                updatedQuestions.push({ ...q, rationale: "Rationale generation error occurred." });
                // Continue with other questions
            }
        }

        console.log("✅ [VA Rationales] All rationales generated");

        return updatedQuestions;
    } catch (error) {
        console.error("❌ [VA Rationales] Error in generateVARationalesWithEdges:", error);
        throw error;
    }
}
