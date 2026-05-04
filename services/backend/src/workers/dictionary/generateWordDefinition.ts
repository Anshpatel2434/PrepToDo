import { z } from "zod";

import { openai } from "../../config/openai.js";
import { createChildLogger } from "../../common/utils/logger.js";
import { CostTracker } from "../../common/utils/CostTracker.js";

const logger = createChildLogger('dictionary-worker');
const MODEL = "gpt-4o-mini";

export const WordDefinitionSchema = z.object({
    word: z.string(),
    pronunciation: z.string(),
    meanings: z.array(z.object({
        meaning: z.string().describe("Max 10 words"),
        example: z.string().describe("Max 15 words"),
    })),
    origin: z.string(),
    relate_with: z.string(),
    mnemonic: z.string().describe("A brief, 1-liner mnemonic"),
    breakdown: z.string(),
    synonyms: z.array(z.string()),
    antonyms: z.array(z.string()),
    not_found: z.boolean().describe("Set to true if the word is not a recognizable English word or is complete gibberish, otherwise false"),
});

export type WordDefinition = z.infer<typeof WordDefinitionSchema>;

export async function generateWordDefinition(
    word: string,
    sourceContext?: string,
    costTracker?: CostTracker
): Promise<WordDefinition> {
    logger.info({ word }, 'Generating word definition via AI');

    const systemPrompt = `You are Lexi, an expert vocabulary builder designed to help students learn words intuitively and creatively.

Your task is to provide a structured, highly memorable definition for the requested word.

If the word provided is not a recognizable English word or is complete gibberish, set "not_found" to true and provide empty/default values for the rest.

🧠 CREATIVE MNEMONIC REQUIREMENT:
You MUST generate a phonetic, sound-alike mnemonic. Break the word down into recognizable sound-chunks or words that relate to its true meaning. Be extremely creative and clever.

Here are excellent examples of the style you MUST use:
- "loquacious -> talk-a-lot-acious" (sounds like talk a lot)
- "obsequious -> obey-sequious" (hear obey)
- "ubiquitous -> you-be-quit-us" (you be everywhere, can't quit)
- "laconic -> lack-on-ic" (lack of words)
- "intransigent -> in-transition? no!" (refuses to change)
- "mellifluous -> mellow-flow-us" (smooth flowing sound)
- "fastidious -> fast + tidy" (overly neat -> picky)
- "profligate -> pro-fly-gate" (money flies out)
- "sagacious -> sage-acious" (like a sage)
- "perfunctory -> perform + function only" (just doing function)
- "capricious -> cap-rice-us" (changes like flipping a cap)

Constraints:
- Tone: Clever, engaging, humorous, and highly memorable.
- Meanings: Maximum 10 words per meaning. Provide 1 to 3 meanings.
- Examples: Maximum 15 words per example.
- Mnemonic: An arrow-format sound-alike breakdown just like the examples (e.g., "word -> sound-alike").
- Breakdown: Briefly explain the connection between the sound-alike chunks and the actual meaning of the word.

You MUST respond with a valid JSON object matching this schema:
{
  "word": "string",
  "pronunciation": "string",
  "meanings": [{"meaning": "string (Max 10 words)", "example": "string (Max 15 words)"}],
  "origin": "string",
  "relate_with": "string",
  "mnemonic": "string",
  "breakdown": "string",
  "synonyms": ["string"],
  "antonyms": ["string"],
  "not_found": "boolean"
}`;

    const userPrompt = `Word to define: "${word}"
${sourceContext ? `Source Context: "${sourceContext}"\n(Tailor the first meaning/example to fit this context if possible)` : ''}`;

    let completion;
    try {
        completion = await openai.chat.completions.create({
            model: MODEL,
            temperature: 0.7,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });
    } catch (e: any) {
        logger.error({ errorMessage: e.message, name: e.name }, 'OpenAI API call failed in generateWordDefinition');
        throw e;
    }

    const messageContent = completion.choices[0].message.content;
    if (!messageContent) throw new Error("LLM returned empty content");
    
    let parsed: WordDefinition;
    try {
        parsed = WordDefinitionSchema.parse(JSON.parse(messageContent));
    } catch (e) {
        throw new Error("LLM word definition parsing failed: " + String(e));
    }

    if (completion.usage && costTracker) {
        costTracker.logCall(MODEL, completion.usage.prompt_tokens, completion.usage.completion_tokens);
        logger.info({
            input_tokens: completion.usage.prompt_tokens,
            output_tokens: completion.usage.completion_tokens,
            model: MODEL
        }, 'Dictionary insight LLM usage');
    }

    logger.info({ word }, 'Word definition generated successfully');

    return parsed;
}
