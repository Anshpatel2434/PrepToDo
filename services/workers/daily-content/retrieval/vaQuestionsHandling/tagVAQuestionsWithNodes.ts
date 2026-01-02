// tagVAQuestionsWithNodes.ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, Node } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface TagVAQuestionsWithNodesParams {
    questions: Question[];
    nodes: Node[];
}

const QuestionNodeTagSchema = z.object({
    question_id: z.string().uuid(),
    primary_node_id: z.string().uuid(),
    secondary_node_ids: z.array(z.string().uuid()).max(2),
});

const QuestionNodeTagArraySchema = z.array(QuestionNodeTagSchema);

/**
 * Tags VA questions with primary and secondary reasoning nodes from the graph.
 * This helps build the reasoning graph context for rationale generation.
 */
export async function tagVAQuestionsWithNodes(params: TagVAQuestionsWithNodesParams) {
    try {
        const { questions, nodes } = params;

        console.log(`🏷️ [VA Tagging] Tagging ${questions.length} questions with reasoning nodes`);

        // Create node mapping for easier reference
        const nodeMap = new Map(nodes.map(n => [n.label, n]));

        const prompt = `SYSTEM:
You are a CAT VARC expert who understands reasoning structures.
You tag questions with appropriate reasoning nodes from a predefined graph.

CRITICAL RULES:
- Choose PRIMARY_NODE: the main reasoning skill tested by the question
- Choose SECONDARY_NODES: up to 2 additional skills that distractors engage with
- All node_ids must be valid from the provided NODES list

---

USER:
You are given a list of REASONING NODES and a set of VA questions.

For each question, identify:
1. PRIMARY_NODE: The main reasoning skill being tested
2. SECONDARY_NODES (0-2): Additional reasoning skills relevant to distractors

---

## AVAILABLE REASONING NODES

${nodes.map((n, i) => `
${i + 1}. ID: ${n.id} | Label: "${n.label}" | Type: ${n.type}
`).join("\n")}

---

## QUESTIONS TO TAG

${questions.map((q, i) => `

QUESTION ${i + 1}:
Type: ${q.question_type}

${q.question_type === "para_jumble"
    ? `Jumbled Sentences:
${JSON.stringify(q.jumbled_sentences, null, 2)}

Options:
${Object.entries(q.options).map(([key, value]) => `${key}) ${value}`).join("\n")}`
    : `Question: ${q.question_text}

Options:
${Object.entries(q.options).map(([key, value]) => `${key}) ${value}`).join("\n")}`
}
`).join("\n")}

---

## TAGGING GUIDELINES

PRIMARY_NODE selection:
- para_summary: Choose node related to synthesis, main idea, or summarization
- para_completion: Choose node related to logical completion, inference, or flow
- para_jumble: Choose node related to sequencing, logical flow, or coherence
- odd_one_out: Choose node related to pattern recognition, distinction, or logical consistency

SECONDARY_NODES selection:
- Choose nodes that represent traps in the distractors
- Maximum 2 secondary nodes
- Can be empty if distractors don't engage specific reasoning skills

---

## OUTPUT FORMAT

Return STRICT JSON only in this format:
{
  "tags": [
    {
      "question_id": "<uuid>",
      "primary_node_id": "<uuid>",
      "secondary_node_ids": ["<uuid>", "<uuid>"]
    },
    ...
  ]
}

IMPORTANT:
- All node_ids must be from the AVAILABLE REASONING NODES list
- question_id must match the input questions
- secondary_node_ids can be empty array []
- No additional text or commentary
`;

        console.log("⏳ [VA Tagging] Waiting for LLM response");

        const completion = await client.chat.completions.parse({
            model: MODEL,
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC expert who tags questions with reasoning nodes accurately.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(
                z.object({ tags: QuestionNodeTagArraySchema }),
                "question_node_tags"
            ),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed || parsed.tags.length !== questions.length) {
            throw new Error("Invalid VA question tagging output");
        }

        console.log(`✅ [VA Tagging] Tagged ${parsed.tags.length} questions`);

        return parsed.tags;
    } catch (error) {
        console.error("❌ [VA Tagging] Error tagging questions:", error);
        throw error;
    }
}
