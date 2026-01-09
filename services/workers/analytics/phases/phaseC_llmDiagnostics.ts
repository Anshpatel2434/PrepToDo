// VARC Analytics - Phase C: LLM Diagnostics

import { openai } from "../../../config/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { AttemptDatum, DiagnosticsOutput } from "../types";

const MODEL = "gpt-4o-mini";

// Define output schema
const DiagnosticResultSchema = z.object({
    attempt_id: z.string(),
    dominant_reasoning_failures: z.array(z.object({
        reasoning_node_label: z.string(),
        failure_description: z.string(),
    })),
    error_pattern_keys: z.array(z.string()),
    trap_analysis: z.string(),
});

const DiagnosticsOutputSchema = z.object({
    diagnostics: z.array(DiagnosticResultSchema),
});

export async function phaseC_llmDiagnostics(
    incorrectAttempts: AttemptDatum[]
): Promise<z.infer<typeof DiagnosticsOutputSchema>> {

    if (incorrectAttempts.length === 0) {
        console.log('ℹ️ [Phase C] No incorrect attempts to diagnose');
        return { diagnostics: [] };
    }

    console.log(`🧠 [Phase C] Diagnosing ${incorrectAttempts.length} incorrect attempts`);

    // Batch diagnostics (or process individually if needed)
    const prompt = `You are a CAT VARC diagnostic expert analyzing why a student got questions wrong.
For each incorrect attempt below, identify:
1. Which reasoning step(s) failed (use the reasoning_node_ids provided)
2. What error patterns were present (e.g., scope_shift, extreme_option, missed_negation)
3. A brief trap analysis
Output STRICT JSON only. Do NOT explain your reasoning, just output the structured analysis.
INCORRECT ATTEMPTS:
${JSON.stringify(incorrectAttempts.map(a => ({
        attempt_id: a.attempt_id,
        question_text: a.question_text,
        options: a.options,
        correct_answer: a.correct_answer,
        user_answer: a.user_answer,
        metric_keys: a.metric_keys,
    })), null, 2)}
Return your analysis as a JSON object with a 'diagnostics' array.`;

    console.log('⏳ [Phase C] Waiting for LLM response (diagnostics)...');

    try {
        const completion = await openai.chat.completions.parse({
            model: MODEL,
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: "You are a diagnostic analyzer. You output only structured JSON with failure analysis."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: zodResponseFormat(DiagnosticsOutputSchema, "diagnostics"),
        });

        const parsed = completion.choices[0].message.parsed;

        if (!parsed) {
            throw new Error("LLM diagnostics parsing failed");
        }

        console.log(`✅ [Phase C] Generated diagnostics for ${parsed.diagnostics.length} attempts`);

        return parsed;

    } catch (error) {
        console.error('❌ [Phase C] LLM diagnostics failed:', error);
        // Return empty diagnostics on failure (don't block pipeline)
        return { diagnostics: [] };
    }
}