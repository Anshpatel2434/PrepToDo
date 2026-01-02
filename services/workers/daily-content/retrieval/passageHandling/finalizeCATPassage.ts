import { evaluateCATLikeness } from "./evaluateCATLikeness";
import { sharpenToCATStyle } from "./sharpenToCATStyle";

export async function finalizeCATPassage(passage: string) {
    const evaluation = await evaluateCATLikeness(passage);

    console.log("🧪 CAT Evaluation:", evaluation.overall_score);

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
