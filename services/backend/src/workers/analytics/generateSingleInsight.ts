// =============================================================================
// Analytics Worker - Generate Single AI Insight
// =============================================================================
// Reuses the same LLM prompt logic from phaseC_llmDiagnostics but for a single
// question attempt. Called on-demand when user clicks "Generate AI Insights".

import { openai } from "../../config/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { db } from "../../db";
import { userMetricProficiency, userProficiencySignals } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createChildLogger } from "../../common/utils/logger.js";
import { CostTracker } from "../../common/utils/CostTracker";

const logger = createChildLogger('single-insight');
const MODEL = "gpt-4o-mini";

// Same schema as phaseC but for a single diagnostic
const SingleDiagnosticSchema = z.object({
    attempt_id: z.string(),
    analysis: z.string(),
    action: z.string(),
    performance: z.string().nullish(),
    focus_areas: z.array(z.string()),
    related_weak_areas: z.array(z.object({
        dimension_type: z.string(),
        dimension_key: z.string(),
        proficiency_score: z.number(),
        human_readable_description: z.string(),
    })).nullish(),
    dominant_reasoning_failures: z.array(z.object({
        reasoning_node_label: z.string(),
        failure_description: z.string(),
    })),
    error_pattern_keys: z.array(z.string()),
    trap_analysis: z.string().nullish(),
});

const SingleDiagnosticResponseSchema = z.object({
    diagnostic: SingleDiagnosticSchema,
});

export async function generateSingleInsight(userId: string, attemptDatum: any, costTracker?: CostTracker) {
    logger.info({ attemptId: attemptDatum.attempt_id }, 'Generating single AI insight');

    // Fetch user proficiency context
    const proficiencies = await db.query.userMetricProficiency.findMany({
        where: eq(userMetricProficiency.user_id, userId)
    });

    const signals = await db.query.userProficiencySignals.findFirst({
        where: eq(userProficiencySignals.user_id, userId)
    });

    const parseJsonArray = (val: any) => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    const userContext = {
        proficiencies: proficiencies || [],
        weak_topics: parseJsonArray(signals?.weak_topics),
        weak_question_types: parseJsonArray(signals?.weak_question_types),
        genre_strengths: parseJsonArray(signals?.genre_strengths),
        recommended_difficulty: signals?.recommended_difficulty || 'medium',
    };

    // Same system prompt as phaseC_llmDiagnostics
    const systemPrompt = `You are an expert CAT VARC faculty diagnostician embedded inside PrepToDo's analytics pipeline.

Your task is to generate personalized, non-generic diagnostic feedback when a user selects an incorrect option in a VARC question.

This diagnostic is NOT an explanation of the correct answer. It is a post-attempt cognitive diagnosis of why the user likely went wrong and how they should improve.

🧠 CRITICAL BEHAVIORAL RULES (NON-NEGOTIABLE):

1. DO NOT reuse phrasing across responses
   - No copy-paste templates
   - No repeated sentences like "This could be due to a challenge in..."
   - Every diagnostic must feel hand-written

2. Vary the diagnostic angle
   Each response must focus on ONE dominant cognitive failure, such as:
   - Misreading scope
   - Over-weighting examples
   - Ignoring paragraph function
   - Local coherence bias
   - Sequence myopia
   - Theme drift
   - Premature elimination
   - Surface-level paraphrasing

3. Anchor feedback to the QUESTION TYPE
   - Para Summary ≠ Odd One Out ≠ Para Jumble
   - Never give sequencing advice for summaries
   - Never give theme advice for jumbles unless relevant

4. Balance critique with encouragement
   - Always acknowledge ONE genuine strength
   - The strength must be plausible, not generic praise

5. Actionable, not vague
   - "Practice more" is forbidden
   - Give a specific practice behavior

🧪 STYLE CONSTRAINTS:
- Tone: Calm, precise, mentor-like
- Length: Medium (not verbose, not curt)
- Language: Exam-oriented, not academic
- NEVER mention: "AI", "model", "dataset", "training"

✅ OUTPUT STRUCTURE (STRICT):
For EACH incorrect attempt, provide:

1. "analysis": Explain why this student got it wrong (2-3 sentences)
   - Focus on their specific cognitive failure
   - Connect to the question type
   - Reference their proficiency profile if relevant

2. "action": Specific, concrete steps to improve (2-3 actionable tips)
   - Practice techniques, not just "study more"
   - Immediate applicability

3. "performance": Brief encouragement referencing their stronger areas (1 sentence, optional)
   - Must be genuine and specific
   - Connect to their actual strengths from profile

4. "focus_areas": Array of 2-3 specific skills to work on
   - Clean, readable skill names
   - No technical jargon
   - Example: ["Distilling authorial intent", "Separating core claim from illustration"]

5. Technical fields (for system use):
   - "related_weak_areas": Array of weak area objects
   - "dominant_reasoning_failures": Array of reasoning failures
   - "error_pattern_keys": Array of pattern identifiers
   - "trap_analysis": Brief trap explanation

🚫 FINAL HARD CONSTRAINTS:
- Never reuse sentence openers across outputs (e.g., "It seems...", "For this...", "Your choice...")
- Never repeat the same "focus_areas" pair twice
- Never sound like a template
- Every response must feel tailored to that exact mistake
- Use question type to determine diagnostic focus:
  * "rc_question" → Scope, inference bounds, detail vs main idea
  * "para_summary" → Main idea vs supporting details, authorial intent
  * "para_jumble" → Logical flow, sentence function, coherence
  * "odd_one_out" → Theme consistency, sentence function, flow disruption
  * "critical_reasoning" → Assumption identification, argument structure

Remember: You are a faculty member diagnosing ONE student, not a bot filling templates.`;

    const userPrompt = `STUDENT PROFICIENCY PROFILE:
${JSON.stringify(userContext, null, 2)}

INCORRECT ATTEMPT TO ANALYZE:
${JSON.stringify({
        attempt_id: attemptDatum.attempt_id,
        question_text: attemptDatum.question_text,
        question_type: attemptDatum.question_type,
        genre: attemptDatum.genre,
        options: attemptDatum.options,
        correct_answer: attemptDatum.correct_answer,
        user_answer: attemptDatum.user_answer,
        metric_keys: attemptDatum.metric_keys,
    }, null, 2)}

Provide personalized diagnostics that help THIS SPECIFIC STUDENT understand their mistake and improve.`;

    const completion = await openai.chat.completions.parse({
        model: MODEL,
        temperature: 0.3,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: zodResponseFormat(SingleDiagnosticResponseSchema, "single_diagnostic"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
        throw new Error("LLM single insight parsing failed");
    }

    // Enrich related_weak_areas with human-readable descriptions if missing
    if (parsed.diagnostic.related_weak_areas) {
        parsed.diagnostic.related_weak_areas.forEach(weakArea => {
            if (!weakArea.human_readable_description) {
                (weakArea as any).human_readable_description = createHumanReadableDescription(
                    weakArea.dimension_type,
                    weakArea.dimension_key
                );
            }
        });
    }

    if (completion.usage) {
        costTracker?.logCall(MODEL, completion.usage.prompt_tokens, completion.usage.completion_tokens);
        logger.info({
            input_tokens: completion.usage.prompt_tokens,
            output_tokens: completion.usage.completion_tokens,
            model: MODEL
        }, 'Single insight LLM usage');
    }

    logger.info({ attemptId: attemptDatum.attempt_id }, 'Single AI insight generated');

    return parsed.diagnostic;
}

function createHumanReadableDescription(dimensionType: string, dimensionKey: string): string {
    const readableKey = dimensionKey.replace(/_/g, ' ');
    switch (dimensionType) {
        case 'core_metric': return `understanding ${readableKey}`;
        case 'genre': return `${readableKey} passages`;
        case 'question_type': return `${readableKey} questions`;
        case 'reasoning_step': return readableKey;
        default: return readableKey;
    }
}
