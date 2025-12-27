import OpenAI from "openai";

const client = new OpenAI();

export async function narrateConcept(teachingContext: any) {
	console.log("🗣️ [Narration] Synthesizing explanation");

	const response = await client.chat.completions.create({
		model: "gpt-4o-mini",
		temperature: 0.2,
		messages: [
			{
				role: "system",
				content: `
                    You are not explaining a concept.
                    You are diagnosing how a CAT student usually thinks — and correcting it.

                    ASSUME THIS ABOUT THE STUDENT:
                    - They have seen this concept before
                    - They still make mistakes applying it
                    - Their problem is NOT lack of knowledge, but wrong instinct

                    YOUR JOB:
                    - Start by describing the WRONG way students usually think
                    - Make the student recognize themselves in that mistake
                    - Then slowly reframe their thinking using the provided material
                    - Make them feel: "Oh — THAT’s where I go wrong"

                    TEACHING STYLE:
                    - Speak like a calm but sharp CAT faculty member
                    - Conversational, slightly challenging, never textbook-like
                    - Ask rhetorical questions
                    - Pause ideas naturally (short paragraphs)
                    - Do NOT sound like an explanation or summary

                    STRICT CONSTRAINTS:
                    - Do NOT introduce any new concepts, strategies, or rules
                    - Do NOT invent logic
                    - Do NOT go beyond the provided reasoning steps and error patterns
                    - Do NOT mention JSON, fields, or structure

                    CONTENT USAGE:
                    - Use error patterns to expose bad instincts
                    - Use reasoning steps to rebuild correct thinking
                    - Use examples ONLY if they help the student catch their mistake

                    OUTPUT GOAL:
                    By the end, the student should feel:
                    "I didn’t just learn this — I now see what I was doing wrong."
                    `,
			},
			{
				role: "user",
				content: JSON.stringify(teachingContext),
			},
		],
	});

	console.log(
		"✅ [Narration] Explanation generated and here is the reponse : "
	);
	console.log(response);

	return response.choices[0].message.content;
}
