// =============================================================================
// Daily Content Worker - Generate Batch VA Rationales
// =============================================================================
// OpenAI-based batch rationale generation for VA questions

import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../types";
import { CostTracker } from "../utils/CostTracker";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage: Passage;
    questions: Question[];
}

/**
 * Generates CAT-style rationales for multiple VA questions in a single batched API call.
 * Optimized version to reduce token usage by batching and sharing reference data.
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

    // Remove edge-relationship / node-label scaffolding patterns
    cleaned = cleaned.replace(
        /^\s*\d+\.?\s*\*\*(?:Requires|Applies|Validates|Misleads_into|Eliminates|Contradicts|Optimizes|Step_of|Supports)\*\*\s*→\s*\*\*?[^:]+\*\*?:\s*/gim,
        ""
    );

    // Remove inline relationship arrow tokens if present
    cleaned = cleaned.replace(
        /\b(?:Requires|Applies|Validates|Misleads_into|Eliminates|Contradicts|Optimizes|Step_of|Supports)\b\s*→\s*/g,
        ""
    );

    // Trim excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
}

export async function generateBatchVARationales(
    params: {
        questions: any[];
        reasoningContexts: Record<string, ReasoningGraphContext>;
        referenceData: ReferenceDataSchema[];
    },
    costTracker?: CostTracker
) {
    try {
        const { questions, reasoningContexts, referenceData } = params;

        console.log(`🧾 [Batch VA Rationales] Generating rationales for ${questions.length} questions in single API call`);

        // Reduce reference data to 2 passages
        const reducedReferences = referenceData.slice(0, 2);

        // Group questions by type for better reference matching
        const questionsByType = questions.reduce((acc, q) => {
            if (!acc[q.question_type]) acc[q.question_type] = [];
            acc[q.question_type].push(q);
            return acc;
        }, {} as Record<string, any[]>);

        // Build question blocks
        const questionBlocks = questions.map((q, index) => {
            const context = reasoningContexts[q.id];
            if (!context) {
                console.warn(`⚠️ [Batch VA Rationales] Missing context for ${q.id}`);
                return null;
            }

            const questionContent = (q.question_type === "para_jumble" || q.question_type === "odd_one_out")
                ? `Jumbled Sentences:\n${JSON.stringify(q.jumbled_sentences, null, 2)}`
                : `Options:\n${Object.entries(q.options || {}).map(([key, value]) => `${key}) ${value}`).join("\n")}`;

            return `
---
QUESTION ${index + 1} (ID: ${q.id}):
Type: ${q.question_type}

${q.question_text}

${questionContent}

CORRECT ANSWER: ${q.correct_answer.answer}

REASONING GRAPH (Hidden Rubric):
Core Metrics: ${context.metric_keys.join(", ")}
Reasoning steps: ${context.nodes.map(n => `${n.label}: ${n.justification}`).join("; ")}
Elimination cues: ${context.edges.slice(0, 2).map(e => `${e.relationship} from ${e.source_node_label} to ${e.target_node_label}`).join("; ")}
`;
        }).filter(Boolean).join("\n");

        // Build reference examples grouped by question type
        const referenceExamples = Object.keys(questionsByType).map(qType => {
            const examples = reducedReferences
                .flatMap(ref => ref.questions.filter(q => q.question_type === qType))
                .slice(0, 2);

            if (examples.length === 0) return "";

            return `
${qType.toUpperCase()} Examples:
${examples.map((q, i) => `
Example ${i + 1}:
${q.question_text}
${q.question_type === "para_jumble" || q.question_type === "odd_one_out"
                    ? `Jumbled Sentences: ${JSON.stringify(q.jumbled_sentences, null, 2)}`
                    : `Options: ${JSON.stringify(q.options, null, 2)}`}
Correct: ${q.correct_answer.answer}
Rationale: ${q.rationale}
`).join("\n")}`;
        }).filter(Boolean).join("\n===\n");

        const prompt = `SYSTEM:
You are a CAT VARC expert mentor.
You teach the elimination process and thinking errors behind tempting wrong options for VA questions.

IMPORTANT:
- Do NOT expose graph scaffolding
- Do NOT use section headers like "PART 1"
- Write like actual PYQ rationales

---

USER:
Write CAT-style rationales for ALL ${questions.length} VA questions below.

## REFERENCE MATERIAL

${referenceExamples}

---

## TARGET QUESTIONS

${questionBlocks}

---

## OUTPUT REQUIREMENTS

For each question, provide a rationale following these type-specific guidelines:

**For para_jumble questions:**
1) Identify the "Anchor": Explain the Mandatory Pair (two sentences that must stay together) or the starting sentence, citing specific keywords (pronouns, conjunctions, or chronology).
2) Explain wrong sequences: 
   - The Trap: Why the flow seems okay initially (e.g., "Sentence 1 and 2 share a keyword").
   - The Flaw: The specific "logical break" (e.g., "Sentence 3 introduces an acronym that wasn't defined until Sentence 4").
3) Briefly dismiss other sequences: Point out one structural error (e.g., "Sequence starts with a concluding transition").
4) The "Golden Key": Highlight the specific **connector word** (e.g., **"However," "This," "Thus"**) that locks the order.

**For odd_one_out questions:**
1) Define the "Common Thread": Briefly state the specific theme or logical structure that connects four of the sentences.
2) Eliminate TWO "Trap" sentences: 
   - Option: State the sentence letter/number.
   - The Trap: Why it feels like it belongs (e.g., "It uses the same subject matter/vocabulary").
   - The Connection: Explain exactly how it fits into the main group's logic.
3) Briefly dismiss the remaining fit: State why it is safely part of the group.
4) The "Misfit" Factor: Highlight the specific **word or scope shift** that makes the odd sentence different (e.g., **"Personal opinion vs. General facts"**).

**For para_summary and para_completion questions:**
1) Explain briefly why the correct option is correct, anchored to the logic/passage.
2) Eliminate at least TWO wrong options in a way that is clearly guided by the elimination cues.
   - For each eliminated option: state the option letter, why it tempts, what it gets wrong.
3) Briefly dismiss any remaining option(s) without over-explaining.
4) Use simple words and specifically highlight the part of the question which solves the question.

**Hard constraints (all types):**
- Do NOT include the cue list, relationship words, node labels, or any prompt meta-language.
- Do NOT use fixed section headers such as "PART 1" / "SYSTEMATIC ELIMINATION".
- Keep the tone academic and exam-oriented.
- Keep the structure flexible (2–6 short paragraphs OR compact bullets), similar to PYQs.

## OUTPUT FORMAT

Return STRICT JSON:
{
  "rationales": [
    {
      "question_id": "uuid",
      "rationale": "text",
      "metric_keys": ["key1", "key2"]
    }
  ]
}

Generate exactly ${questions.length} rationales IN THE SAME ORDER.`;

        console.log(`⏳ [Batch VA Rationales] Waiting for LLM response for ${questions.length} questions`);

        const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 0.25,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC expert mentor. You write rationales without exposing internal rubrics. You return valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: { type: "json_object" },
        });

        const rawResponse = completion.choices[0]?.message?.content?.trim();
        if (!rawResponse) {
            throw new Error("Failed to generate batch VA rationales");
        }

        // Log token usage to cost tracker
        if (costTracker && completion.usage) {
            costTracker.logCall(
                "generateBatchVARationales",
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            );
        }

        const parsed = JSON.parse(rawResponse);
        if (!parsed.rationales || !Array.isArray(parsed.rationales)) {
            throw new Error("Invalid batch rationale response structure");
        }

        console.log(`✅ [Batch VA Rationales] Generated ${parsed.rationales.length} rationales`);

        // Map rationales back to questions
        const rationaleMap = new Map(
            parsed.rationales.map((r: any) => [r.question_id, r])
        );

        const updatedQuestions = questions.map((q) => {
            const rationaleData = rationaleMap.get(q.id) as { question_id: string; rationale: string; metric_keys?: string[] } | undefined;
            const context = reasoningContexts[q.id];

            if (!rationaleData || !context) {
                console.warn(`⚠️ [Batch VA Rationales] Fallback for question ${q.id}`);
                return {
                    ...q,
                    rationale: rationaleData?.rationale || "Rationale generation incomplete.",
                    tags: context?.metric_keys || [],
                    updated_at: new Date().toISOString(),
                };
            }

            const cleanedRationale = sanitizeRationale(rationaleData.rationale);

            return {
                ...q,
                rationale: cleanedRationale,
                tags: context.metric_keys,
                updated_at: new Date().toISOString(),
            };
        });

        console.log("✅ [Batch VA Rationales] All rationales mapped to questions");
        return updatedQuestions;

    } catch (error) {
        console.error("❌ [Batch VA Rationales] Error in generateBatchVARationales:", error);
        throw error;
    }
}
