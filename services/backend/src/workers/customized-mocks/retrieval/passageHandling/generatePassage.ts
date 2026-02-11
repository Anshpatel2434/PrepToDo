import OpenAI from "openai";
import { AuthorialPersona, SemanticIdeas } from "../../schemas/types";
import { CostTracker } from "../../../../common/utils/CostTracker";
import { createChildLogger } from "../../../../common/utils/logger.js";

const logger = createChildLogger('rc-passage-gen');

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates a CAT-style RC passage using semantic ideas and reference passages.
 *
 * For custom mocks, this includes personalized touches based on user analytics
 * (weak areas, target metrics, difficulty preferences).
 */
export async function generatePassage(
    params: {
        semanticIdeas: SemanticIdeas;
        authorialPersona: AuthorialPersona;
        referencePassages: string[];
        personalization?: {
            targetMetrics?: string[];
            difficultyTarget?: "easy" | "medium" | "hard" | "mixed";
            weakAreas?: string[];
        };
    },
    costTracker?: CostTracker
) {
    const { semanticIdeas, authorialPersona, referencePassages, personalization } = params;

    logger.info(`✍️ [Passage Gen] Starting passage generation (referencePassages=${referencePassages.length})`);

    if (referencePassages.length !== 3) {
        throw new Error(
            `generatePassage expects exactly 3 reference passages, received ${referencePassages.length}`
        );
    }

    // Build personalization instructions
    let personalizationInstructions = "";
    if (personalization) {
        const instructions = [];

        if (personalization.targetMetrics && personalization.targetMetrics.length > 0) {
            instructions.push(`Target Metrics: Focus on testing these reasoning skills - ${personalization.targetMetrics.join(", ")}`);
        }

        if (personalization.difficultyTarget && personalization.difficultyTarget !== "mixed") {
            instructions.push(`Difficulty Target: Overall passage should be ${personalization.difficultyTarget} difficulty`);
        }

        if (personalization.weakAreas && personalization.weakAreas.length > 0) {
            instructions.push(`Weak Areas to Test: Include elements that challenge these areas - ${personalization.weakAreas.join(", ")}`);
        }

        if (instructions.length > 0) {
            personalizationInstructions = `

### PERSONALIZATION INSTRUCTIONS

The following user-specific customization should guide passage generation (apply subtly):

${instructions.map((instr, i) => `${i + 1}. ${instr}`).join("\n")}

IMPORTANT: These personalizations should feel natural, not forced. Maintain CAT quality.
`;
        }
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
Your task is to generate ONE NEW Reading Comprehension passage for custom mock practice.

You are given THREE types of inputs:

1) SEMANTIC IDEAS (abstracted, copyright-safe)
2) AUTHORIAL PERSONA (STYLE ONLY)
3) REFERENCE PASSAGES from previous year CAT papers (NO QUESTIONS)
${personalizationInstructions ? `4) PERSONALIZATION INSTRUCTIONS` : ""}

You must use ALL THREE${personalizationInstructions ? `, plus personalization if provided` : ""}, but follow the rules strictly.

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
${JSON.stringify(authorialPersona, null, 2)}
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
</REFERENCE_PASSAGES>

---

### CAT PASSAGE CHARACTERISTICS (INTERNAL KNOWLEDGE)

CAT RC passages are typically sourced from:
- Academic journals and textbooks (social sciences, humanities, behavioral economics, psychology, political science, philosophy, history, ecology)
- Long-form magazines and essays (The Economist, Atlantic, New Yorker, Harper's, Prospect, Frontline)
- Non-fiction books (popular and academic trade excerpts)
- Newspapers and feature articles (in-depth features and reportage)
- Technical and policy reports (think-tank briefs, white papers)

PASSAGE CHARACTERISTICS:
- Length: 400-500 words
- Complexity: high lexical density, multiple clauses, low redundancy
- Structure: layered argumentation (definitions, premises, evidence, objections, conclusions)
- Viewpoint: expository or argumentative, presenting a thesis plus counter-arguments

HOW PASSAGES ARE ADAPTED FOR CAT:
- Edited for length without changing argument structure
- Language tightened while retaining complexity and inference requirements
- Cultural references neutralized to focus on reasoning, not background knowledge

---

### GENERATION CONSTRAINTS (MANDATORY)

- Word count: 400-500 words (optimal range for CAT)
- Paragraphs: 3 to 4
- Tone: neutral, analytical, academic
- No storytelling
- No moral judgement
- No rhetorical questions
- No authorial opinion
- No examples or case studies unless logically necessary
- The passage must be answerable using the text alone

---

### VOCABULARY DIFFICULTY REQUIREMENT (CRITICAL):
- Use MEDIUM-LEVEL vocabulary appropriate for CAT previous year papers
- Avoid overly complex, obscure, or technical jargon that would require specialized knowledge
- The vocabulary should be challenging but accessible to well-read candidates
- Use words that appear in quality journalism and academic writing (The Economist, Atlantic, academic journals)
- Avoid archaic, highly specialized, or unnecessarily ornate vocabulary
- Examples of appropriate vocabulary level: "nuanced", "paradigm", "empirical", "inherent", "substantive", "ambiguous"
- Examples of TOO COMPLEX vocabulary to AVOID: "recondite", "abstruse", "prolix", "sesquipedalian", "obfuscate"
- The passage should test comprehension and reasoning, NOT vocabulary knowledge
- Match the vocabulary difficulty level observed in the reference passages provided

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

## STYLE ENFORCEMENT RULES AND MANDATORY REQUIREMENT:
- Use at least 2 semicolons (;) in the passage
- Use at least 2 em-dashes (—) to introduce evaluative contrast
- Use quotation marks at least once to distance or problematize a term
- At least 2 sentences must explicitly challenge a dominant assumption
- Avoid smooth academic transitions; allow controlled friction between ideas


### CRITICAL LENGTH CONSTRAINT:
- You MUST produce at least 500 words.
- If the passage is shorter than 500 words, it is INVALID.
- If necessary, deepen arguments rather than summarizing.
- Do NOT conclude early.

---

### PARAGRAPH DEPTH RULE:
- Each paragraph must develop a distinct idea.
- Avoid short or transitional paragraphs.
- Each paragraph should have layered argumentation.

---

### LOGICAL STRUCTURE REQUIREMENTS

Ensure the passage contains:
- At least 2 implicit assumptions (not stated explicitly)
- At least 1 conceptual shift or contrast across paragraphs
- At least 1 paragraph that invites inference rather than stating conclusions
- Controlled ambiguity suitable for CAT-level questions
- Examples, caveats, and qualifiers used appropriately

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
Before responding, verify that the passage length is between 400 and 500 words.
If not, expand the analysis until it is.
`

    logger.info("⏳ [Passage Gen] Waiting for LLM response (draft passage)");
    // logger.debug("Ref Data (Ideas):", JSON.stringify(semanticIdeas).substring(0, 500) + "...");
    // logger.debug("Ref Data (Passages):", JSON.stringify(referencePassages).substring(0, 500) + "...");

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

    // Log token usage to cost tracker
    if (costTracker && completion.usage) {
        costTracker.logCall(
            "generatePassage",
            completion.usage.prompt_tokens,
            completion.usage.completion_tokens
        );
    }

    logger.info(`✅ [Passage Gen] Passage generated (length=${passage.length} chars)`);

    return passage;
}
