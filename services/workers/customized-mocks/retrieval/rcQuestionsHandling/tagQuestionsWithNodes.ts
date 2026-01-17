import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Question, QuestionMetricTag } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const QuestionMetricTagSchema = z.object({
    question_id: z.string().uuid(),
    metric_keys: z.array(z.string()).max(2),
});

const ResponseSchema = z.object({
    question_tags: z.array(QuestionMetricTagSchema),
});

/**
 * Tags RC questions with reasoning graph node metrics.
 */
export async function tagQuestionsWithNodes(params: {
    passageText: string;
    questions: Question[];
}): Promise<QuestionMetricTag[]> {
    const { passageText, questions } = params;

    console.log(`🏷️ [Tagging] Tagging ${questions.length} questions with metrics`);

    const prompt = `You are a CAT reasoning graph expert. Tag questions with core metrics.

PASSAGE:
${passageText}

QUESTIONS:
${questions.map((q, i) => `
Q${i + 1} (${q.id}): ${q.question_text}
`).join("\n")}

For each question, identify the 1-2 core metrics from "user_core_metrics_definition_v1.json" that best describe the reasoning being tested.

Available metric categories (examples):
- inference
- synthesis
- evaluation
- analysis
- comprehension
- logical_reasoning
- critical_thinking
- textual_evidence
- assumption_detection
- tone_analysis

Return JSON:
{
  "question_tags": [
    { "question_id": "...", "metric_keys": ["metric1", "metric2"] }
  ]
}

Rules:
- Assign 1-2 metrics per question (max 2)
- Choose the most relevant metrics for each question
- Use metric keys from the standard list
`;

    console.log("⏳ [Tagging] Waiting for LLM to tag questions");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: "You are a CAT reasoning graph expert. Tag questions with core metrics.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(ResponseSchema, "question_tags"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed || parsed.question_tags.length !== questions.length) {
        console.warn(`⚠️ [Tagging] Got ${parsed?.question_tags.length || 0} tags for ${questions.length} questions`);
    }

    console.log(`✅ [Tagging] Tagged ${parsed?.question_tags.length || 0} questions`);
    return parsed?.question_tags || [];
}
