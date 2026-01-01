import OpenAI from "openai";

const client = new OpenAI();
const MODEL = "gpt-4o-mini"; // stronger model for rewriting

export async function sharpenToCATStyle(params: {
    passage: string;
    deficiencies: string[];
}) {
    const { passage, deficiencies } = params;

    const prompt = `
You are revising a passage to meet CAT Reading Comprehension standards.

IMPORTANT:
- Do NOT change the topic
- Do NOT add examples
- Do NOT add new arguments
- Do NOT simplify language
- Preserve paragraph count and length

Your task is to FIX the following deficiencies:
${deficiencies.map(d => `- ${d}`).join("\n")}

STYLE ENFORCEMENT:
- Increase syntactic friction
- Use punctuation to express judgment (semicolons, em dashes)
- Strengthen authorial stance
- Remove textbook neutrality
- Avoid neat conclusions

<Passage>
${passage}
</Passage>

Return ONLY the revised passage.
`;

    const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content:
                    "You rewrite passages to meet CAT standards. You sharpen, not expand.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    const revised = completion.choices[0]?.message?.content?.trim();
    if (!revised) {
        throw new Error("Failed to sharpen passage");
    }

    return revised;
}
