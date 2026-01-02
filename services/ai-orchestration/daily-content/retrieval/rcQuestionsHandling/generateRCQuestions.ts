import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {z} from "zod"
import { Passage, Question, QuestionSchema } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

interface ReferenceDataSchema {
    passage : Passage;
    questions: Question[];
}

const ResponseSchema = z.object({
    questions : z.array(QuestionSchema)
})

export async function generateRCQuestions(params: {
    passageText: string;
    referenceData: ReferenceDataSchema[];
    questionCount: number;
}) {
    const {
        passageText,
        referenceData,
        questionCount,
    } = params;

    const prompt = `SYSTEM:
You are a CAT VARC examiner responsible ONLY for setting questions.
You do NOT solve questions.
You do NOT explain answers.

USER:
Your task is to generate CAT-style RC questions for the NEW passage.

You are also given REFERENCE MATERIAL:
- Three past CAT passages
- Their questions

These references exist ONLY to guide:
- question framing
- inference depth
- trap construction
- wording discipline

STRICT RULES:
- Do NOT reuse question text
- Do NOT reuse option phrasings
- Do NOT decide the correct answer
- Do NOT write rationales
- Use ONLY the NEW passage to frame questions

--------------------------------
NEW PASSAGE (TARGET)
--------------------------------
${passageText}

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
QUESTION REQUIREMENTS
--------------------------------
Generate EXACTLY {{N}} questions.

Include a mix of:
- inference
- tone OR purpose
- detail-based
- implication / main idea

Each question must:
- Be answerable using the NEW passage alone
- Have exactly 4 options
- Avoid absolute words unless passage supports them

--------------------------------
OUTPUT FORMAT
--------------------------------
Return STRICT JSON.
Each question MUST follow this schema:

- id: generate a UUID
- question_text: string
- question_type: "rc_question"
- options: JSON object
- correct_answer: { "answer": "" }
- rationale: ""
- difficulty: derived
- tags: derived`;

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content:
                    "You generate CAT RC questions only. You do not solve or explain.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "rc_questions"
        ),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.questions.length !== questionCount) {
        throw new Error("Invalid RC question generation output");
    }

    return parsed.questions;
}
