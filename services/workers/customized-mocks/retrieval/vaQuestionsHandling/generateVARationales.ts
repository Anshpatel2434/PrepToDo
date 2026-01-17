import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, ReasoningGraphContext } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const RationaleResponseSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        rationale: z.string(),
    })),
);

/**
 * Generates rationales for VA questions using reasoning graph edges.
 */
export async function generateVARationalesWithEdges(params: {
    questions: Question[];
    reasoningContexts: Record<string, ReasoningGraphContext>;
    referenceData: any[];
}): Promise<Question[]> {
    const { questions, reasoningContexts, referenceData } = params;

    console.log(`🧾 [VA Rationales] Generating rationales for ${questions.length} questions`);

    // Build context string for each question
    const questionContexts = questions.map(q => {
        const context = reasoningContexts[q.id];
        if (!context) return `Q: ${q.question_text}\nNo reasoning context available`;

        return `Q (${q.question_type}): ${q.question_text}
Metrics: ${context.metric_keys.join(", ")}

Nodes (reasoning steps):
${context.nodes.map(n => `- ${n.label}: ${n.justification}`).join("\n")}

Edges (relationships):
${context.edges.map(e => `- ${e.source_node_label} → ${e.relationship} → ${e.target_node_label}`).join("\n")}`;
    }).join("\n\n---\n\n");

    const prompt = `You are a CAT VARC examiner. Write elimination-driven rationales for VA questions.

QUESTIONS WITH REASONING CONTEXT:
${questionContexts}

For each question, write a rationale that:
1. Identifies the correct answer
2. Explains why each wrong option is eliminated
3. Uses the reasoning context (metrics, nodes) to frame the explanation
4. Does NOT reveal internal structure (no "PART 1", no node labels)
5. Sounds like a CAT PYQ rationale
6. Is concise (2-3 sentences for correct answer, 1 sentence each for wrong options)

Return JSON:
{
  "questions": [
    { "id": "...", "rationale": "The correct answer is A. Option B is wrong because..." }
  ]
}

IMPORTANT:
- Focus on elimination logic
- Explain why EACH wrong option is incorrect
- Use natural language, no technical jargon
- Do not mention metrics, nodes, or edges by name
`;

    console.log("⏳ [VA Rationales] Waiting for LLM to generate rationales");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content: "You are a CAT VARC examiner. Write elimination-driven rationales.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(RationaleResponseSchema, "va_rationales"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
        throw new Error("Failed to generate VA rationales");
    }

    // Merge rationales into questions
    const rationaleMap = new Map(parsed.questions.map(r => [r.id, r.rationale]));

    const questionsWithRationales = questions.map(q => ({
        ...q,
        rationale: rationaleMap.get(q.id) || "",
    }));

    console.log(`✅ [VA Rationales] Generated rationales for all questions`);
    return questionsWithRationales;
}
