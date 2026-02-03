import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { QuestionMetricTagArraySchema } from "../../schemas/types";
import z from "zod";
import { user_core_metrics_definition_v1 } from "../../../../config/user_core_metrics_definition_v1";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

// Read metrics definition
const metricsData = user_core_metrics_definition_v1
const metricsCatalog = metricsData.metrics.map((m: any) => ({
    metric_key: m.metric_key,
    description: m.description
}));

const ResponseSchema = z.object({
    questionsTagged: QuestionMetricTagArraySchema
})

/**
 * Tags VA questions using metric_keys instead of reasoning graph nodes.
 */
export async function tagVAQuestionsWithNodes(params: {
    questions: any[];
}) {
    const { questions } = params;

    console.log(
        `🏷️ [VA Metric Tagging] Tagging ${questions.length} questions`
    );

    const prompt = `
You are a CAT diagnostic engine.

Your task is to identify which cognitive metrics are assessed by each VA (Verbal Ability) question.

RULES:
- Do NOT explain
- Do NOT justify
- Choose up to TWO metric_keys that best suit the question from the provided catalog.

--------------------------------
METRICS CATALOG
--------------------------------
${JSON.stringify(metricsCatalog, null, 2)}

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

    console.log("⏳ [VA Metric Tagging] Waiting for LLM response (metric tags)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content: "You classify cognitive metrics. You do not explain or reason.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "va_metric_tags"
        ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("VA Metric tagging failed");
    }

    console.log(`✅ [VA Metric Tagging] Tags generated for ${parsed.questionsTagged.length} questions`);

    // Returns raw array matching QuestionMetricTagArraySchema, exactly like the RC function
    return parsed.questionsTagged;
}
