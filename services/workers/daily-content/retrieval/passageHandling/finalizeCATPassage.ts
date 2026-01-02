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
    console.log("🧩 [Passage Finalize] Evaluating + sharpening passage");

    const evaluation = await evaluateCATLikeness(passage);

    console.log(
        `🧩 [Passage Finalize] Sharpening passage based on ${evaluation.key_deficiencies.length} deficiencies`
    );

    const improvedPassage = await sharpenToCATStyle({
        passage,
        deficiencies: evaluation.key_deficiencies,
    });

    console.log("✅ [Passage Finalize] Passage finalized");

    return {
        passageData: improvedPassage,
        evaluation: evaluation,
        upgraded: true,
    };
}
