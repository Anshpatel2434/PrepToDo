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
    // Additional fields for VA questions
    sentence_ideas: z.array(z.string()).min(5).describe("Key sentence-level ideas that can form the basis of para_jumble, para_summary, para_completion questions"),
    conceptual_pairs: z.array(z.object({
        idea_a: z.string(),
        idea_b: z.string(),
        relationship: z.string()
    })).min(3).describe("Pairs of related ideas for odd_one_out questions"),
    logical_transitions: z.array(z.string()).min(3).describe("Logical connectors and transitions used in the text"),
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

THIS TASK HAS THREE DISTINCT PARTS.
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
1. Core topic - Be DESCRIPTIVE and COMPREHENSIVE (2-3 sentences explaining the central theme, not just a label)
2. Subtopics discussed - Each subtopic should be a DETAILED description (1-2 sentences each), not just keywords
3. Key arguments or positions (abstracted) - Provide FULL, NUANCED descriptions of each argument with context and implications
4. Implicit assumptions - Articulate the UNDERLYING BELIEFS or PREMISES in complete, explanatory sentences
5. Areas of ambiguity or debate - Describe SPECIFIC TENSIONS, UNRESOLVED QUESTIONS, or COMPETING INTERPRETATIONS in detail

DESCRIPTIVE FORMAT REQUIREMENT:
- Each extracted idea should be a complete, self-explanatory statement
- Provide sufficient context so the idea stands alone without the original text
- Use full sentences with proper explanations, not bullet points or fragments
- Capture the DEPTH and NUANCE of the argument, not just surface-level labels

--------------------------------------------------
PART 2: SENTENCE-LEVEL IDEAS (FOR VA QUESTIONS)
--------------------------------------------------

These ideas will be used to generate:
- Para jumble questions (ordering of sentences)
- Para summary questions (identifying the best summary)
- Para completion questions (completing a sentence/paragraph)
- Odd one out questions (identifying the sentence that doesn't belong)

Extract:
1. sentence_ideas: 5-10 distinct, self-contained sentence-level ideas from the text
   - Each should be a COMPLETE, DETAILED, STANDALONE thought (2-3 sentences)
   - They should represent key logical steps or arguments WITH FULL CONTEXT
   - Avoid preserving exact wording but maintain the DEPTH of the idea
   - Include enough detail so each idea is independently comprehensible

2. conceptual_pairs: 3-5 pairs of related ideas
   - For each pair: idea_a, idea_b, relationship (how they connect)
   - Make idea_a and idea_b DESCRIPTIVE and DETAILED (1-2 sentences each)
   - Describe the relationship with SPECIFICITY (explain HOW and WHY they connect)
   - These will be used for odd_one_out questions

3. logical_transitions: 3-5 key logical connectors used
   - Examples: "however", "therefore", "consequently", "in contrast"
   - For each transition, provide CONTEXT: what it connects and why it's significant
   - These help identify sentence order and paragraph structure

--------------------------------------------------
PART 3: AUTHORIAL PERSONA (STYLE META-DATA)
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
- typical_moves (recurring argumentative strategies) - Be SPECIFIC and DESCRIPTIVE about each move (full sentences explaining the strategy)
- syntactic_traits (sentence-level tendencies) - Provide DETAILED descriptions of patterns (e.g., "Uses long, complex sentences with multiple subordinate clauses to build layered arguments")
- closure_style (how the author typically ends arguments)

DESCRIPTIVE FORMAT FOR PERSONA:
- typical_moves: Each move should be a COMPLETE DESCRIPTION of the rhetorical strategy with examples of its effect
- syntactic_traits: Each trait should FULLY EXPLAIN the pattern and its purpose in the author's style

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
