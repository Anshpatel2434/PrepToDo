import { evaluateCATLikeness } from "./evaluateCATLikeness";
import { sharpenToCATStyle } from "./sharpenToCATStyle";

/**
 * Finalizes passage by evaluating CAT likeness and sharpening based on deficiencies.
 *
 * Two-step process:
 * 1. Evaluate passage against CAT standards (argumentative spine, authorial voice, etc.)
 * 2. Rewrite passage to fix identified deficiencies while preserving content
 */
export async function finalizeCATPassage(passage: string) {
    const evaluation = await evaluateCATLikeness(passage);

    const improvedPassage = await sharpenToCATStyle({
        passage,
        deficiencies: evaluation.key_deficiencies,
    });

    return {
        passageData: improvedPassage,
        evaluation: evaluation,
        upgraded: true,
    };
}
