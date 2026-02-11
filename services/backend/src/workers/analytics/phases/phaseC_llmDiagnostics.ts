// VARC Analytics - Phase C: LLM Diagnostics (Personalized)

import { openai } from "../../../config/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { AttemptDatum, DiagnosticsOutput } from "../types";
import { db } from "../../../db";
import { userMetricProficiency, userProficiencySignals } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('analytics-phase-c');

const MODEL = "gpt-4o-mini";

// Define output schema - Updated structure with named components for better frontend rendering
const DiagnosticResultSchema = z.object({
    attempt_id: z.string(),

    // Named components for structured display
    analysis: z.string(), // Renamed from 'personalized_analysis' for consistency
    action: z.string(), // Renamed from 'targeted_advice' 
    performance: z.string().nullish(), // Renamed from 'strength_comparison'
    focus_areas: z.array(z.string()), // New: Specific focus areas as a clean list

    // Internal technical fields (not displayed directly)
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

const DiagnosticsOutputSchema = z.object({
    diagnostics: z.array(DiagnosticResultSchema),
});

// Helper to create human-readable descriptions from metric keys
function createHumanReadableDescription(dimensionType: string, dimensionKey: string): string {
    const readableKey = dimensionKey.replace(/_/g, ' ');

    switch (dimensionType) {
        case 'core_metric':
            return `understanding ${readableKey}`;
        case 'genre':
            return `${readableKey} passages`;
        case 'question_type':
            return `${readableKey} questions`;
        case 'reasoning_step':
            return `${readableKey}`;
        default:
            return readableKey;
    }
}

export async function phaseC_llmDiagnostics(
    userId: string,
    incorrectAttempts: AttemptDatum[]
): Promise<z.infer<typeof DiagnosticsOutputSchema>> {

    if (incorrectAttempts.length === 0) {
        logger.info('No incorrect attempts to diagnose');
        return { diagnostics: [] };
    }

    logger.info({ count: incorrectAttempts.length }, 'Diagnosing incorrect attempts');

    // Fetch user proficiency metrics
    logger.info('Fetching user proficiency context');
    const proficiencies = await db.query.userMetricProficiency.findMany({
        where: eq(userMetricProficiency.user_id, userId)
    });

    // Fetch user proficiency signals
    const signals = await db.query.userProficiencySignals.findFirst({
        where: eq(userProficiencySignals.user_id, userId)
    });

    // Build user context for LLM
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

    logger.info({
        proficienciesCount: userContext.proficiencies.length,
        weakTopics: userContext.weak_topics
    }, "User context loaded");

    // Build enhanced prompt with user context
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

INCORRECT ATTEMPTS TO ANALYZE:
${JSON.stringify(incorrectAttempts.map(a => ({
        attempt_id: a.attempt_id,
        question_text: a.question_text,
        question_type: a.question_type,
        genre: a.genre,
        options: a.options,
        correct_answer: a.correct_answer,
        user_answer: a.user_answer,
        metric_keys: a.metric_keys,
    })), null, 2)}

For each incorrect attempt, provide personalized diagnostics that help THIS SPECIFIC STUDENT understand their mistake and improve.`;

    logger.info('Waiting for LLM response');

    try {
        const completion = await openai.chat.completions.parse({
            model: MODEL,
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: zodResponseFormat(DiagnosticsOutputSchema, "diagnostics"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed) {
            throw new Error("LLM diagnostics parsing failed");
        }

        // Enrich related_weak_areas with human-readable descriptions if not provided
        if (parsed.diagnostics.length > 0) {
            parsed.diagnostics.forEach(diagnostic => {
                if (diagnostic.related_weak_areas) {
                    diagnostic.related_weak_areas.forEach(weakArea => {
                        if (!weakArea.human_readable_description) {
                            (weakArea as any).human_readable_description = createHumanReadableDescription(
                                weakArea.dimension_type,
                                weakArea.dimension_key
                            );
                        }
                    });
                }
            });
        }

        // Log cost if tracker provided
        if (completion.usage) {
            // We can't log here easily without passing tracker down.
            // For now, let's just log it to standard logger as info
            logger.info({
                input_tokens: completion.usage.prompt_tokens,
                output_tokens: completion.usage.completion_tokens,
                model: MODEL
            }, 'LLM Usage Stats');
        }

        logger.info({ diagnosticsCount: parsed.diagnostics.length }, "Generated personalized diagnostics");

        return parsed;

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'LLM diagnostics failed');
        // Return empty diagnostics on failure (don't block pipeline)
        return { diagnostics: [] };
    }
}
