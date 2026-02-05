// =============================================================================
// Daily Content Worker - Tag Questions With Nodes
// =============================================================================
// OpenAI-based metric tagging - copied with updated imports

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { QuestionMetricTagArraySchema } from "../../types";
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

/**
 * Tags each question with up to 2 metric_keys from the user core metrics definition.
 */

const ResponseSchema = z.object({
    questionsTagged: QuestionMetricTagArraySchema
})

export async function tagQuestionsWithNodes(params: {
    passageText: string;
    questions: any[];
}) {
    const { passageText, questions } = params;

    console.log(
        `🏷️ [Metric Tagging] Tagging ${questions.length} questions`
    );

    const prompt = `
You are a CAT diagnostic engine.

Your task is to identify which cognitive metrics are assessed by each question.

RULES:
- Do NOT explain
- Do NOT justify
- Choose up to TWO metric_keys that best suit the question from the provided catalog.

--------------------------------
PASSAGE
--------------------------------
${passageText}

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
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
        })),
        null,
        2
    )}

Return STRICT JSON only.
`;

    console.log("⏳ [Metric Tagging] Waiting for LLM response (metric tags)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content:
                    "You classify cognitive metrics. You do not explain or reason.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            ResponseSchema,
            "metric_tags"
        ),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("Metric tagging failed");
    }

    console.log(`✅ [Metric Tagging] Tags generated for ${parsed.questionsTagged.length} questions`);
    console.log("---------------------------------------- RC Tags Generated: ", JSON.stringify(parsed.questionsTagged, null, 2));

    // Validate that we got tags for ALL questions
    if (parsed.questionsTagged.length !== questions.length) {
        console.warn(`⚠️ [Metric Tagging] Expected ${questions.length} tagged questions, got ${parsed.questionsTagged.length}`);

        // Find which questions are missing tags
        const taggedIds = new Set(parsed.questionsTagged.map(q => q.question_id));
        const missingQuestions = questions.filter(q => !taggedIds.has(q.id));

        console.warn(`⚠️ [Metric Tagging] Missing tags for ${missingQuestions.length} questions:`,
            missingQuestions.map(q => q.id));

        // Add default tags for missing questions
        const defaultTags = missingQuestions.map(q => ({
            question_id: q.id,
            metric_keys: ["inference", "critical_reasoning"] // default fallback metrics
        }));

        return [...parsed.questionsTagged, ...defaultTags];
    }

    return parsed.questionsTagged;
}
