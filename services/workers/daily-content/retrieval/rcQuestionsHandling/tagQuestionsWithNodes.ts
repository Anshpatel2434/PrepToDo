import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { QuestionNodeTagArraySchema } from "../../schemas/types";
import z from "zod";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const ResponseSchema = z.object({
    questionsTagged : QuestionNodeTagArraySchema
})

export async function tagQuestionsWithNodes(params: {
    passageText: string;
    questions: any[];
    nodes: { id: string; label: string; type: string }[];
}) {
    const { passageText, questions, nodes } = params;

    const filteredNodes = nodes.filter((node) => node.type === "ReasoningStep")
    console.log("these are the filtred nodes ")
    console.log(JSON.stringify(filteredNodes, null, 2))

    const prompt = `
You are a CAT diagnostic engine.

Your task is to identify which cognitive skills or concepts
are required to correctly answer each question.

RULES:
- Do NOT explain
- Do NOT justify
- Choose ONE primary node
- Optionally choose up to TWO secondary nodes

--------------------------------
PASSAGE
--------------------------------
${passageText}

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
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
        })),
        null,
        2
    )}

Return STRICT JSON only.
`;

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content:
                    "You classify cognitive skills. You do not explain or reason.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "node_tags"
        ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("Node tagging failed");
    }

    return parsed.questionsTagged;
}
