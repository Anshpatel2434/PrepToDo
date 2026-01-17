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
 * Tags VA questions with reasoning graph node metrics.
 */
export async function tagVAQuestionsWithNodes(params: {
    questions: Question[];
}): Promise<QuestionMetricTag[]> {
    const { questions } = params;

    console.log(`🏷️ [Tagging] Tagging ${questions.length} VA questions with metrics`);

    const prompt = `You are a CAT reasoning graph expert. Tag VA questions with core metrics.

QUESTIONS:
${questions.map((q, i) => `
Q${i + 1} (${q.question_type}): ${q.question_text}
`).join("\n")}

For each question, identify 1-2 core metrics from "user_core_metrics_definition_v1.json" that best describe the reasoning being tested.

Return JSON:
{
  "question_tags": [
    { "question_id": "...", "metric_keys": ["metric1", "metric2"] }
  ]
}

Rules:
- Assign 1-2 metrics per question (max 2)
- Choose most relevant metrics for each question type
- For VA questions, focus on: logical_structure, coherence, semantic_relationships
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
        response_format: zodResponseFormat(ResponseSchema, "va_question_tags"),
    });

    const parsed = completion.choices[0].message.parsed;

    console.log(`✅ [Tagging] Tagged ${parsed?.question_tags.length || 0} questions`);
    return parsed?.question_tags || [];
}
