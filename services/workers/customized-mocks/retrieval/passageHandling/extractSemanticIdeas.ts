import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { AuthorialPersona, SemanticIdeas } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

export const SemanticIdeasSchema = z.object({
    core_topic: z.string(),
    subtopics: z.array(z.string()).min(2),
    key_arguments: z.array(z.string()).min(3),
    implicit_assumptions: z.array(z.string()).min(1),
    areas_of_ambiguity: z.array(z.string()).min(1),
    sentence_ideas: z.array(z.string()).min(5).describe("Key sentence-level ideas for VA questions"),
    conceptual_pairs: z.array(z.object({
        idea_a: z.string(),
        idea_b: z.string(),
        relationship: z.string()
    })).min(3).describe("Pairs for odd_one_out questions"),
    logical_transitions: z.array(z.string()).min(3).describe("Logical connectors"),
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

/**
 * Extracts semantic ideas and authorial persona from source article.
 * This provides content structure (not content) and writing style guide.
 */
export async function extractSemanticIdeasAndPersona(
    articleText: string,
    genre: string
): Promise<{ semantic_ideas: SemanticIdeas; authorial_persona: AuthorialPersona }> {
    console.log(`🧠 [Semantic Extraction] Extracting from article (${articleText.length} chars)`);

    const prompt = `You are a CAT content analyst. Extract semantic ideas and authorial persona from the article below.

ARTICLE:
${articleText}

GENRE: ${genre}

Extract:
1) Semantic Ideas (WHAT the article discusses)
   - core_topic
   - subtopics (2-4 key themes)
   - key_arguments (3-5 main claims)
   - implicit_assumptions (1-2 unstated premises)
   - areas_of_ambiguity (1-2 deliberately vague concepts)
   - sentence_ideas (5-7 key sentences for VA questions)
   - conceptual_pairs (3-5 related idea pairs)
   - logical_transitions (3-5 connectors used)

2) Authorial Persona (HOW arguments are made, NOT what)
   - stance_type (critical|revisionist|skeptical|corrective|warning-driven)
   - evaluative_intensity (low|medium|high)
   - typical_moves (2-3 argumentative techniques)
   - syntactic_traits (2-3 sentence patterns)
   - closure_style (open-ended|cautionary|unresolved)

CRITICAL: Extract the IDEAS (content structure), not the content itself. This is for copyright-safe content generation.
`;

    console.log("⏳ [Semantic Extraction] Waiting for LLM response");

    const completion = await client.chat.completions.parse({
        model: MODEL,
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content: "You are a CAT content analyst. Extract semantic structure, not verbatim content.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(SemanticExtractionOutputSchema, "semantic_extraction"),
    });

    console.log("✅ [Semantic Extraction] LLM response received");

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
        throw new Error("Failed to extract semantic ideas from article");
    }

    console.log(`✅ [Semantic Extraction] Extracted ${parsed.semantic_ideas.subtopics.length} subtopics`);
    return {
        semantic_ideas: parsed.semantic_ideas,
        authorial_persona: parsed.authorial_persona,
    };
}
