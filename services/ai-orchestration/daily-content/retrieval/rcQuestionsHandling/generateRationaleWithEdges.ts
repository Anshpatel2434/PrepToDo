import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage : Passage;
    questions: Question[];
}

export async function generateRationalesWithEdges(params: {
    passageText: string;
    questions: any[];
    reasoningContexts: Record<string, ReasoningGraphContext>;
    referenceData: ReferenceDataSchema[];
}) {
    const { passageText, questions, reasoningContexts, referenceData } = params;

    const updatedQuestions = [];

    for (const q of questions) {
        const context = reasoningContexts[q.id];
        if (!context) {
            throw new Error(`Missing reasoning context for question ${q.id}`);
        }

        const prompt = `
You are generating a CAT-style rationale.

IMPORTANT:
- You are NOT discovering reasoning
- You are EXPLAINING an existing reasoning structure
- Follow the reasoning graph strictly

You are also given REFERENCE MATERIAL:
- Three past CAT passages
- Their questions

These references exist ONLY to guide:
- inference depth
- trap construction
- wording discipline
- (Use these to calibrate the complexity of your vocabulary and the 'tightness' of logic)
- Review the REFERENCE MATERIAL. Ensure the language is academic, avoids "First Person" (I/Me), and maintains the level of inference depth seen in the examples.

STRICT RULES:
- Do NOT reuse question text
- Do NOT reuse option phrasings
- Use ONLY the NEW passage to frame questions rationales

--------------------------------
REFERENCE PASSAGE 1
--------------------------------
${referenceData[0].passage.content}

REFERENCE QUESTIONS 1
${JSON.stringify(referenceData[0].questions[0], null, 2)} + \n
${JSON.stringify(referenceData[0].questions[1], null, 2)} + \n
${JSON.stringify(referenceData[0].questions[2], null, 2)} + \n
${JSON.stringify(referenceData[0].questions[3], null, 2)} + \n

--------------------------------
REFERENCE PASSAGE 2
--------------------------------
${referenceData[1].passage.content}

REFERENCE QUESTIONS 2
${JSON.stringify(referenceData[1].questions[0], null, 2)} + \n
${JSON.stringify(referenceData[1].questions[1], null, 2)} + \n
${JSON.stringify(referenceData[1].questions[2], null, 2)} + \n
${JSON.stringify(referenceData[1].questions[3], null, 2)} + \n

--------------------------------
REFERENCE PASSAGE 3
--------------------------------
${referenceData[2].passage.content}

REFERENCE QUESTIONS 1
${JSON.stringify(referenceData[2].questions[0], null, 2)} + \n
${JSON.stringify(referenceData[2].questions[1], null, 2)} + \n
${JSON.stringify(referenceData[2].questions[2], null, 2)} + \n
${JSON.stringify(referenceData[2].questions[3], null, 2)} + \n

--------------------------------
PASSAGE
--------------------------------
${passageText}

--------------------------------
QUESTION
--------------------------------
${q.question_text}

OPTIONS
${JSON.stringify(q.options, null, 2)}

CORRECT ANSWER
${q.correct_answer.answer}

--------------------------------
REASONING GRAPH
--------------------------------
Primary Reasoning Step:
- ${context.primary_node.label}

Reasoning Links:
${context.edges
                .map(
                    e =>
                        `- (${e.relationship}) ${e.target_node.label} [${e.target_node.type}]`
                )
                .join("\n")}

--------------------------------
TASK
--------------------------------
Write a CAT-style rationale that:
- Explains why the correct option works using the SUPPORTING nodes
- Explains why at least one incorrect option fails using MISLEADING nodes
- Does NOT mention nodes, edges, or graph terminology
- Uses neutral, exam-oriented language
`;

        const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content:
                        "You verbalise structured reasoning into CAT rationales.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const rationale = completion.choices[0]?.message?.content?.trim();
        if (!rationale) {
            throw new Error("Failed to generate rationale");
        }

        updatedQuestions.push({
            ...q,
            rationale,
            tags: [
                context.primary_node.label,
                ...context.edges.map(e => e.target_node.label),
            ],
            updated_at: new Date().toISOString(),
        });
    }

    return updatedQuestions;
}
