import OpenAI from "openai";
import { AuthorialPersona, SemanticIdeas } from "./extractSemanticIdeas";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates a CAT-style RC passage using semantic ideas and reference passages.
 *
 * Inputs:
 * - semanticIdeas: Abstracted content ideas representing what the passage should discuss
 * - authorialPersona: Style guide extracted from source text (not content)
 * - referencePassages: 5 actual CAT passages for style calibration only
 *
 * Key design principles:
 * - Semantic ideas provide the content structure
 * - Authorial persona provides the writing style
 * - Reference passages provide CAT-style anchors (not content to copy)
 * - Anti-overfitting: passage must be distinguishable as new content
 *
 * The prompt enforces CAT characteristics:
 * - 450-600 words, 3-5 paragraphs
 * - Argumentative spine with position advancement
 * - Authorial voice: evaluative, not neutral
 * - Syntactic friction: semicolons, em-dashes, qualifying clauses
 * - No neat conclusions, leave conceptual tension unresolved
 */
export async function generatePassage(params: {
    // semanticIdeas: SemanticIdeas;
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    referencePassages: string[]; // exactly 5 passages
}) {
    const { semanticIdeas, authorialPersona, referencePassages } = params;

    console.log(`✍️ [Passage Gen] Starting passage generation (referencePassages=${referencePassages.length})`);

    if (referencePassages.length !== 5) {
        throw new Error(
            `generatePassage expects exactly 5 reference passages, received ${referencePassages.length}`
        );
    }

    const prompt = `SYSTEM:
You are a senior CAT VARC paper setter with over 15 years of experience.
You understand CAT Reading Comprehension at the level of:
- inference density
- ambiguity management
- elimination logic
- neutrality of tone

IMPORTANT:
You will reason step-by-step internally,
but you MUST NOT reveal your reasoning or analysis.
Only output the final passage.

---

USER:
Your task is to generate ONE NEW Reading Comprehension passage for daily practice.

You are given TWO types of inputs:

1) SEMANTIC IDEAS (abstracted, copyright-safe)
2) AUTHORIAL PERSONA (STYLE ONLY)
3) REFERENCE PASSAGES from previous year CAT papers (NO QUESTIONS)

You must use BOTH, but follow the rules strictly.

---

### INPUT 1: SEMANTIC IDEAS (PRIMARY CONTENT SOURCE)

These ideas represent WHAT the passage should discuss.
You must use these ideas to determine:
- topic
- arguments
- conceptual flow

<SEMANTIC_IDEAS>
${JSON.stringify(semanticIdeas, null, 2)}
</SEMANTIC_IDEAS>

### INPUT 2: AUTHORIAL PERSONA (STYLE ONLY)

You are given an abstracted authorial persona derived from a source text.
This persona represents HOW arguments are typically advanced,
NOT what is argued.

RULES:
- Do NOT imitate phrasing
- Do NOT imitate sentence structures directly
- Do NOT reuse metaphors or rhetorical flourishes
- Use the persona ONLY to guide tone, posture, and argumentative stance

<AUTHORIAL_PERSONA>
${JSON.stringify(authorialPersona, null, 2)}}
</AUTHORIAL_PERSONA>

---

### INPUT 3: REFERENCE PASSAGES (STYLE & DIFFICULTY ANCHORS ONLY)

These passages are provided ONLY to help you understand:
- sentence complexity
- paragraph length
- abstraction level
- CAT-style neutrality

STRICT RULES FOR REFERENCE PASSAGES:
- Do NOT reuse phrasing
- Do NOT reuse sentence structure
- Do NOT reuse paragraph flow
- Do NOT mirror argument order
- Treat them as STYLE SIGNALS ONLY

<REFERENCE_PASSAGES>
1.
${referencePassages[0]}

---
2.
${referencePassages[1]}

---
3.
${referencePassages[2]}

---
4.
${referencePassages[3]}

---
5.
${referencePassages[4]}
</REFERENCE_PASSAGES>

---

### GENERATION CONSTRAINTS (MANDATORY)

- Word count: 450-600 words
- Paragraphs: 3 to 5
- Tone: neutral, analytical, academic
- No storytelling
- No moral judgement
- No rhetorical questions
- No authorial opinion
- No examples or case studies unless logically necessary
- The passage must be answerable using the text alone

---

### AUTHORIAL VOICE REQUIREMENT:
- Write as if an informed author is advancing a position, not summarizing literature
- The passage must critique at least one commonly held assumption
- Use evaluative but restrained language (e.g., "misleading", "insufficient", "problematic", "tenuous")
- Avoid textbook exposition

---

### AUTHORIAL REGISTER REQUIREMENT:
- The passage must read as if written by a confident, opinionated analyst
- The author must implicitly take a position and push back against at least one dominant narrative
- Use evaluative but reasoned language (e.g., "untenable", "misleading", "insufficient", "overstated")
- Avoid neutral reportage or textbook exposition

---

### SYNTACTIC STYLE REQUIREMENT:
- Use varied sentence lengths
- Use punctuation deliberately (semicolons, em dashes, parentheses) where appropriate
- Avoid repetitive sentence openings
- At least two sentences should contain a qualifying clause that limits or reframes a claim

---

## AUTHORIAL PERSONA — ENFORCED STYLE RULES

The following persona traits are MANDATORY, not advisory.

Stance: ${authorialPersona.stance_type}
Evaluative Intensity: ${authorialPersona.evaluative_intensity}
Closure Style: ${authorialPersona.closure_style}

You MUST reflect these traits using FORM, not just vocabulary.

## STYLE ENFORCEMENT RULES:
- Use at least 2 semicolons (;) in the passage
- Use at least 2 em-dashes (—) to introduce evaluative contrast
- Use quotation marks at least once to distance or problematize a term
- At least 2 sentences must explicitly challenge a dominant assumption
- Avoid smooth academic transitions; allow controlled friction between ideas


### CRITICAL LENGTH CONSTRAINT:
- You MUST produce at least 450 words.
- If the passage is shorter than 450 words, it is INVALID.
- If necessary, deepen arguments rather than summarizing.
- Do NOT conclude early.

---

### PARAGRAPH DEPTH RULE:
- Each paragraph must develop a distinct idea.
- Avoid short or transitional paragraphs.

---

### LOGICAL STRUCTURE REQUIREMENTS

Ensure the passage contains:
- At least 2 implicit assumptions (not stated explicitly)
- At least 1 conceptual shift or contrast across paragraphs
- At least 1 paragraph that invites inference rather than stating conclusions
- Controlled ambiguity suitable for CAT-level questions

---

### ANTI-OVERFITTING RULE (CRITICAL)

Even if the reference passages are similar in topic,
your passage MUST:
- Introduce a fresh conceptual framing
- Use a different logical progression
- Be clearly distinguishable as a new passage

---

### ENDING CONSTRAINT:
- Do NOT summarize the passage
- Do NOT offer a neat conclusion
- The final paragraph should leave a conceptual tension unresolved
- Avoid phrases such as "In conclusion", "This suggests that", "Overall"


### OUTPUT FORMAT

Return ONLY the passage text.
Do NOT include headings.
Do NOT include explanations.
Do NOT include reasoning.
Do NOT include bullet points.

FINAL CHECK (DO NOT OUTPUT):
Before responding, verify that the passage length is between 450 and 500 words.
If not, expand the analysis until it is.
`

    // // Inject dynamic values into the already-approved prompt
    // const prompt = GENERATE_PASSAGE_PROMPT
    //     .replace("{{SEMANTIC_IDEAS_JSON}}", JSON.stringify(semanticIdeas, null, 2))
    //     .replace("{{PASSAGE_1_TEXT}}", referencePassages[0])
    //     .replace("{{PASSAGE_2_TEXT}}", referencePassages[1])
    //     .replace("{{PASSAGE_3_TEXT}}", referencePassages[2])
    //     .replace("{{PASSAGE_4_TEXT}}", referencePassages[3])
    //     .replace("{{PASSAGE_5_TEXT}}", referencePassages[4]);

    console.log("⏳ [Passage Gen] Waiting for LLM response (draft passage)");

    const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2, // low creativity, high control
        messages: [
            {
                role: "system",
                content: "You write like a CAT passage author, not a textbook editor.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    const passage = completion.choices[0]?.message?.content?.trim();

    if (!passage) {
        throw new Error("Failed to generate passage from LLM");
    }

    console.log(`✅ [Passage Gen] Passage generated (length=${passage.length} chars)`);

    return passage;
}
