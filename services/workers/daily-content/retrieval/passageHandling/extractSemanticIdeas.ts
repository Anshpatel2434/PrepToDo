// extractSemanticIdeas.ts
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

/* =========================================================
   1. Schemas
   ========================================================= */

export const SemanticIdeasSchema = z.object({
    core_topic: z.string(),
    subtopics: z.array(z.string()).min(2),
    key_arguments: z.array(z.string()).min(3),
    implicit_assumptions: z.array(z.string()).min(1),
    areas_of_ambiguity: z.array(z.string()).min(1),
});

export const AuthorialPersonaSchema = z.object({
    stance_type: z.enum([
        "critical",
        "revisionist",
        "skeptical",
        "corrective",
        "warning-driven",
    ]),
    evaluative_intensity: z.enum(["low", "medium", "high"]),
    typical_moves: z.array(z.string()).min(2),
    syntactic_traits: z.array(z.string()).min(2),
    closure_style: z.enum(["open-ended", "cautionary", "unresolved"]),
});

export const SemanticExtractionOutputSchema = z.object({
    semantic_ideas: SemanticIdeasSchema,
    authorial_persona: AuthorialPersonaSchema,
});

export type SemanticIdeas = z.infer<typeof SemanticIdeasSchema>;
export type AuthorialPersona = z.infer<typeof AuthorialPersonaSchema>;
export type SemanticExtractionOutput = z.infer<
    typeof SemanticExtractionOutputSchema
>;

/* =========================================================
   2. LLM Setup
   ========================================================= */

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/* =========================================================
   3. Extraction Function
   ========================================================= */

/**
 * Extracts:
 * 1) Abstract semantic ideas (WHAT is being argued)
 * 2) Authorial persona (HOW the argument is advanced)
 *
 * IMPORTANT:
 * - Article text must NEVER be stored
 * - Persona extraction must be meta-style only
 */
export async function extractSemanticIdeasAndPersona(
    articleText: string,
    genre: string
): Promise<SemanticExtractionOutput> {
    console.log(`🧠 [Semantic Extract] Extracting semantic ideas + persona (genre=${genre})`);

    const prompt = `
You are an extraction engine for exam content creation.

THIS TASK HAS TWO DISTINCT PARTS.
DO NOT MIX THEM.

--------------------------------------------------
PART 1: SEMANTIC IDEAS (CONTENT)
--------------------------------------------------

RULES:
- You are NOT summarizing
- You are NOT rewriting
- You are NOT paraphrasing
- Extract IDEAS ONLY

ABSOLUTE CONSTRAINTS:
- Do NOT preserve wording
- Do NOT preserve sentence order
- Do NOT preserve paragraph structure
- Do NOT use metaphors
- Do NOT include examples
- Do NOT include author opinions

Extract:
1. Core topic
2. Subtopics discussed
3. Key arguments or positions (abstracted)
4. Implicit assumptions
5. Areas of ambiguity or debate

--------------------------------------------------
PART 2: AUTHORIAL PERSONA (STYLE META-DATA)
--------------------------------------------------

This is NOT about content.

Extract ONLY the author's RHETORICAL POSTURE.

RULES:
- Do NOT quote the article
- Do NOT imitate phrases
- Do NOT copy sentence structures
- Do NOT include metaphors
- Describe patterns, not expressions

Identify:
- stance_type (overall argumentative posture)
- evaluative_intensity (degree of judgment)
- typical_moves (recurring argumentative strategies)
- syntactic_traits (sentence-level tendencies)
- closure_style (how the author typically ends arguments)

--------------------------------------------------

TARGET GENRE: ${genre}

<Article>
${articleText}
</Article>

Return STRICT JSON only in the required schema.
`;

    console.log("⏳ [Semantic Extract] Waiting for LLM response (extraction)");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content:
                    "You extract abstract ideas and meta-level authorial persona only. Any stylistic or textual copying is a failure.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(
            SemanticExtractionOutputSchema,
            "semantic_and_persona"
        ),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
        throw new Error("Failed to extract semantic ideas and authorial persona");
    }

    console.log("✅ [Semantic Extract] Extraction complete");

    return parsed;
}
