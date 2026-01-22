// VARC Analytics - Phase C: LLM Diagnostics (Personalized)

import { openai } from "../../../config/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { AttemptDatum, DiagnosticsOutput } from "../types";

const MODEL = "gpt-4o-mini";

// Define output schema
const DiagnosticResultSchema = z.object({
    attempt_id: z.string(),
    personalized_analysis: z.string(),
    targeted_advice: z.string(),
    related_weak_areas: z.array(z.object({
        dimension_type: z.string(),
        dimension_key: z.string(),
        proficiency_score: z.number(),
        human_readable_description: z.string(),
    })).nullish(),
    strength_comparison: z.string().nullish(),
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
    supabase: any,
    userId: string,
    incorrectAttempts: AttemptDatum[]
): Promise<z.infer<typeof DiagnosticsOutputSchema>> {

    if (incorrectAttempts.length === 0) {
        console.log('ℹ️ [Phase C] No incorrect attempts to diagnose');
        return { diagnostics: [] };
    }

    console.log(`🧠 [Phase C] Diagnosing ${incorrectAttempts.length} incorrect attempts with user context`);

    // Fetch user proficiency metrics
    console.log('📊 [Phase C] Fetching user proficiency context...');
    const { data: proficiencies, error: profError } = await supabase
        .from('user_metric_proficiency')
        .select('*')
        .eq('user_id', userId);

    if (profError) {
        console.error('⚠️ [Phase C] Failed to fetch proficiencies:', profError.message);
    }

    // Fetch user proficiency signals
    const { data: signals, error: signalsError } = await supabase
        .from('user_proficiency_signals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (signalsError) {
        console.error('⚠️ [Phase C] Failed to fetch signals:', signalsError.message);
    }

    // Build user context for LLM
    const userContext = {
        proficiencies: proficiencies || [],
        weak_topics: signals?.weak_topics || [],
        weak_question_types: signals?.weak_question_types || [],
        genre_strengths: signals?.genre_strengths || [],
        recommended_difficulty: signals?.recommended_difficulty || 'medium',
    };

    console.log(`   - User proficiencies loaded: ${userContext.proficiencies.length} metrics`);
    console.log(`   - Weak topics: ${userContext.weak_topics.join(', ') || 'None identified'}`);

    // Build enhanced prompt with user context
    const systemPrompt = `You are a personalized CAT VARC diagnostic coach. Your role is to analyze why THIS SPECIFIC STUDENT got questions wrong based on their unique proficiency profile.

CRITICAL INSTRUCTIONS:
1. Write in a supportive, conversational tone as if speaking directly to the student
2. NEVER use technical terms like "metric_keys", "dimension_type", "proficiency_score", "reasoning_node_label", or "core_metric"
3. Use natural language to describe concepts (e.g., "identifying the main argument" not "argument_identification")
4. Provide specific, actionable next steps the student can take immediately
5. Reference their strengths to provide encouragement and context
6. Focus on WHY this particular student struggled, not generic reasons

OUTPUT REQUIREMENTS:
- personalized_analysis: Explain why THIS student got it wrong based on their profile (2-3 sentences)
- targeted_advice: Specific, concrete steps to improve (2-3 actionable tips)
- strength_comparison: Brief encouragement referencing their stronger areas (1 sentence, optional)
- related_weak_areas: Identify which of their weak areas contributed to this mistake
- dominant_reasoning_failures: Technical analysis (for system use)
- error_pattern_keys: Pattern identifiers (for system use)
- trap_analysis: Brief explanation of the trap in the question`;

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

    console.log('⏳ [Phase C] Waiting for LLM response (personalized diagnostics)...');

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
        for (const diagnostic of parsed.diagnostics) {
            if (diagnostic.related_weak_areas) {
                for (const weakArea of diagnostic.related_weak_areas) {
                    if (!weakArea.human_readable_description) {
                        weakArea.human_readable_description = createHumanReadableDescription(
                            weakArea.dimension_type,
                            weakArea.dimension_key
                        );
                    }
                }
            }
        }

        console.log(`✅ [Phase C] Generated personalized diagnostics for ${parsed.diagnostics.length} attempts`);

        return parsed;

    } catch (error) {
        console.error('❌ [Phase C] LLM diagnostics failed:', error);
        // Return empty diagnostics on failure (don't block pipeline)
        return { diagnostics: [] };
    }
}
