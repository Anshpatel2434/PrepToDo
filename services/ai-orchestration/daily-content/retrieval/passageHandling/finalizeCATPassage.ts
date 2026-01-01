import { evaluateCATLikeness } from "./evaluateCATLikeness";
import { sharpenToCATStyle } from "./sharpenToCATStyle";

export async function finalizeCATPassage(passage: string) {
    const evaluation = await evaluateCATLikeness(passage);

    console.log("🧪 CAT Evaluation:", evaluation.overall_score);

    if (evaluation.overall_score >= 90) {
        return {
            passage,
            evaluation,
            upgraded: false,
        };
    }

    const improvedPassage = await sharpenToCATStyle({
        passage,
        deficiencies: evaluation.key_deficiencies,
    });

    const reEvaluation = await evaluateCATLikeness(improvedPassage);

    if (reEvaluation.overall_score < 80) {
        throw new Error(
            `Passage failed CAT threshold after sharpening (${reEvaluation.overall_score})`
        );
    }

    return {
        passage: improvedPassage,
        evaluation: reEvaluation,
        upgraded: true,
    };
}
