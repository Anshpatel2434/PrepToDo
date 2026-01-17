import OpenAI from "openai";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Evaluates how CAT-like the passage is.
 * Returns a score and feedback.
 */
export async function evaluateCATLikeness(passageText: string): Promise<{
    score: number;
    feedback: string;
}> {
    console.log("📊 [CAT Likeness] Evaluating passage quality...");

    // For now, return default
    // In future, could run detailed evaluation
    return {
        score: 0.85,
        feedback: "Passage appears CAT-like",
    };
}
