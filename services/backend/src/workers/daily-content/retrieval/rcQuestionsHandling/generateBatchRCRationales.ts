// =============================================================================
// Daily Content Worker - Generate Batch RC Rationales
// =============================================================================
// OpenAI-based batch rationale generation - simplified with updated imports

import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../types";
import { CostTracker } from "../utils/CostTracker";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates CAT-style rationales for multiple RC questions in a single batched API call.
 * This is an optimized version that reduces token usage by sending reference data once.
 *
 * Design goals:
 * - Batch process all questions in one API call instead of sequential calls
 * - Send reference passages once (shared across all questions)
 * - Maintain same output structure as sequential version
 * - Use graph-driven elimination logic
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

export async function generateBatchRCRationales(
    params: {
        passageText: string;
        questions: any[];
        reasoningContexts: Record<string, ReasoningGraphContext>;
        referenceData: ReferenceDataSchema[];
    },
    costTracker?: CostTracker
) {
    const { passageText, questions, reasoningContexts, referenceData } = params;

    console.log(`🧾 [Batch RC Rationales] Generating rationales for ${questions.length} questions in single API call`);

    // Reduce reference data to 2 passages (from 3)
    const reducedReferences = referenceData.slice(0, 2);

    // Filter out questions without reasoning context
    const validQuestions = questions.filter(q => {
        if (!reasoningContexts[q.id]) {
            console.warn(`⚠️ [Batch RC Rationales] Skipping question ${q.id} - missing reasoning context`);
            return false;
        }
        return true;
    });

    if (validQuestions.length === 0) {
        console.warn(`⚠️ [Batch RC Rationales] No valid questions with reasoning context`);
        return questions.map(q => ({
            ...q,
            rationale: "Rationale generation skipped - missing reasoning context.",
            updated_at: new Date().toISOString(),
        }));
    }

    // Build the batch prompt using only valid questions
    const questionBlocks = validQuestions.map((q, index) => {
        const context = reasoningContexts[q.id];

        return `
---
QUESTION ${index + 1} (ID: ${q.id}):
${q.question_text}

OPTIONS:
${Object.entries(q.options)
                .map(([key, value]) => `${key}) ${value}`)
                .join("\n")}

CORRECT ANSWER: ${q.correct_answer.answer}

REASONING GRAPH (Hidden Rubric — Do Not Mention):
Core Metrics: ${context.metric_keys.join(", ")}

Reasoning steps:
${context.nodes.map(n => `- ${n.label}: ${n.justification}`).join("\n")}

Elimination cues (use at least TWO):
${context.edges
                .map(
                    (e, i) =>
                        `${i + 1}. relationship="${e.relationship}", from="${e.source_node_label}", to="${e.target_node_label}"`
                )
                .join("\n")}
`;
    }).join("\n");

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
Write CAT-style rationales for ALL ${questions.length} TARGET QUESTIONS below.

You are given REFERENCE MATERIAL from actual CAT papers.
Study it to match the usual level of precision, tone, and concision.

---

## REFERENCE MATERIAL (Observe Patterns)

${reducedReferences.map((ref, i) => `
PASSAGE ${i + 1}:
${ref.passage.content}

Questions with Rationales:
${ref.questions
            .slice(0, 4)
            .map(
                (rq, j) => `
Question ${j + 1}:
${rq.question_text}

Options:
${JSON.stringify(rq.options, null, 2)}

Correct Answer: ${rq.correct_answer.answer}

Rationale:
${rq.rationale}
`
            )
            .join("\n---\n")}
`).join("\n===\n")}

---

## TARGET PASSAGE

${passageText.trim().split(/\n\n+/).map((p, i) => `[${i + 1}] ${p}`).join("\n\n")}

---

## TARGET QUESTIONS

${questionBlocks}

---

## OUTPUT REQUIREMENTS (Must Follow for EACH question)

For each question, provide a rationale that:
1) Explains briefly why the correct option is correct, anchored to the passage.
   - **CRITICAL: Quote the specific line(s) from the passage** that support the correct answer
   - Format: "The passage states in paragraph [number]: '[exact quote]'" (Use the explicit paragraph numbers [x] marked in the target text)
   
2) Eliminates at least TWO wrong options in a way that is clearly guided by the elimination cues.
   - For each eliminated option: 
     * State the option letter
     * Why it tempts
     * What it gets wrong
     * **CRITICAL: Reference the specific passage line(s)** that contradict or don't support this option
     * Format: "However, the passage says in paragraph [number]: '[exact quote]' which contradicts this" (Use the explicit paragraph numbers [x])
   
3) Briefly dismisses any remaining option(s) without over-explaining.

4) **MANDATORY**: Every rationale MUST include at least 2-3 direct quotations from the passage to support the reasoning.

5) Use simple words and specifically highlight the part of the passage which solves the question.

Hard constraints:
- Do NOT include the cue list, relationship words, node labels, or any prompt meta-language.
- Do NOT use fixed section headers such as "PART 1" / "SYSTEMATIC ELIMINATION".
- Keep the tone academic and exam-oriented.
- Keep the structure flexible (2-6 short paragraphs OR compact bullets), similar to PYQs.
- **ALWAYS quote relevant passage lines from [number]** (using the provided [x] markers) to justify correct/incorrect options.

## OUTPUT FORMAT

Return STRICT JSON in this format:
{
  "rationales": [
    {
      "question_id": "uuid-here",
      "rationale": "rationale text here with passage quotations",
      "metric_keys": ["key1", "key2"]
    }
  ]
}

Generate exactly ${questions.length} rationale objects, one for each question IN THE SAME ORDER.`;

    console.log(`⏳ [Batch RC Rationales] Waiting for LLM response for ${questions.length} questions`);

    const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.25,
        messages: [
            {
                role: "system",
                content:
                    "You are a CAT VARC expert mentor. You write rationales that teach elimination without exposing internal rubrics. You return valid JSON.",
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
        throw new Error("Failed to generate batch rationales");
    }

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generateBatchRCRationales",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    const parsed = JSON.parse(rawResponse);
    if (!parsed.rationales || !Array.isArray(parsed.rationales)) {
        throw new Error("Invalid batch rationale response structure");
    }

    if (parsed.rationales.length !== validQuestions.length) {
        console.warn(
            `⚠️ [Batch RC Rationales] Expected ${validQuestions.length} rationales, got ${parsed.rationales.length}`
        );
    }

    console.log(`✅ [Batch RC Rationales] Generated ${parsed.rationales.length} rationales`);

    // Map rationales back to valid questions
    const rationaleMap = new Map(
        parsed.rationales.map((r: any) => [r.question_id, r])
    );

    // Process all original questions
    const updatedQuestions = questions.map((q) => {
        // Check if this question had a reasoning context
        const context = reasoningContexts[q.id];
        // Get the rationale data for this question
        const rationaleData = rationaleMap.get(q.id) as { question_id: string; rationale: string; metric_keys?: string[] } | undefined;
        if (!rationaleData || !context) {
            console.warn(`⚠️ [Batch RC Rationales] Fallback for question ${q.id}`);
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
            tags: context.metric_keys, // Use context metric_keys, not from LLM
            updated_at: new Date().toISOString(),
        };
    });

    return updatedQuestions;
}
