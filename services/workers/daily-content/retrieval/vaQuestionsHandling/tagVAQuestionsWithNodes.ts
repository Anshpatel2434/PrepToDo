import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { QuestionNodeTagArraySchema } from "../../schemas/types";
import z from "zod";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const ResponseSchema = z.object({
    questionsTagged: QuestionNodeTagArraySchema
})

/**
 * Tags VA questions using the exact same logic and return format as RC tagging.
 */
export async function tagVAQuestionsWithNodes(params: {
    questions: any[];
    nodes: { id: string; label: string; type: string }[];
}) {
    const { questions, nodes } = params;

    console.log(
        `🏷️ [VA Node Tagging] Tagging ${questions.length} questions (nodes available=${nodes.length})`
    );

    // Filter nodes for ReasoningStep type
    const filteredNodes = nodes.filter((node) => node.type === "ReasoningStep");

    const prompt = `
You are a CAT diagnostic engine.

Your task is to identify which cognitive skills or concepts
are required to correctly answer each VA (Verbal Ability) question.

RULES:
- Do NOT explain
- Do NOT justify
- Choose ONE primary node
- Optionally choose up to TWO secondary nodes

--------------------------------
NODE CATALOG
--------------------------------
${JSON.stringify(filteredNodes, null, 2)}

--------------------------------
QUESTIONS
--------------------------------
${JSON.stringify(
        questions.map(q => ({
            id: q.id,
            type: q.question_type,
            // Logic to handle VA specific content types
            content: (q.question_type === "para_jumble" || q.question_type === "odd_one_out")
                ? q.jumbled_sentences
                : q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
        })),
        null,
        2
    )}

Return STRICT JSON only.
`;

    console.log("⏳ [VA Node Tagging] Waiting for LLM response (node tags)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content: "You classify cognitive skills. You do not explain or reason.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "va_node_tags"
        ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("VA Node tagging failed");
    }

    console.log(`✅ [VA Node Tagging] Tags generated for ${parsed.questionsTagged.length} questions`);

    // Returns raw array matching QuestionNodeTagArraySchema, exactly like the RC function
    return parsed.questionsTagged;
}