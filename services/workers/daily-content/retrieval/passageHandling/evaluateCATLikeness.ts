import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export const CATEvaluationSchema = z.object({
    overall_score: z.number().min(0).max(100),

    breakdown: z.object({
        argumentative_spine: z.number().min(0).max(100),
        authorial_voice: z.number().min(0).max(100),
        syntactic_friction: z.number().min(0).max(100),
        evaluative_language: z.number().min(0).max(100),
        closure_quality: z.number().min(0).max(100),
        cat_exam_realism: z.number().min(0).max(100),
    }),

    key_deficiencies: z.array(z.string()).min(1),

    verdict: z.enum([
        "cat_like",
        "borderline",
        "not_cat_like"
    ]),
});

export type CATEvaluation = z.infer<typeof CATEvaluationSchema>;

const client = new OpenAI();
const MODEL = "gpt-4o-mini"; // cheap & sufficient

export async function evaluateCATLikeness(
    passage: string
): Promise<CATEvaluation> {
    const prompt = `
You are a CAT VARC examiner.

Evaluate the passage STRICTLY as a CAT Reading Comprehension passage.

CRITERIA:
- Argumentative spine (is a position advanced and challenged?)
- Authorial voice (confident, evaluative, not textbook-like)
- Syntactic friction (punctuation, compression, interruptions)
- Evaluative language (measured judgment, not neutrality)
- Closure quality (no neat academic conclusion)
- CAT exam realism

SCORING RULES:
- Be conservative
- 90+ means CAT-quality
- Below 85 means unacceptable for CAT

IMPORTANT CAT CONSTRAINTS:
- Do NOT expect concrete examples or case studies
- Penalize passages that rely on anecdotes or illustrations
- Reward abstraction, generalization, and implicit reasoning

ARGUMENTATIVE SPINE DEFINITION:
- A central position is advanced
- At least one dominant assumption is challenged
- The passage progresses through critique, complication, or reframing
- Counter-positions may be implicit rather than explicitly stated

DO NOT rewrite.
DO NOT suggest content.
ONLY evaluate.

<Passage>
${passage}
</Passage>

Return STRICT JSON only.
`;

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content:
                    "You evaluate passages like a CAT examiner. You do not rewrite.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(CATEvaluationSchema, "cat_eval"),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("Failed to evaluate CAT likeness");
    }
    console.log("Previous cat likeness : ")
    console.log(parsed)

    return parsed;
}
