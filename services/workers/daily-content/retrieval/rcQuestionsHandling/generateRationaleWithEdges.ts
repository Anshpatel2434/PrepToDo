import OpenAI from "openai";
import { Passage, Question, ReasoningGraphContext } from "../../schemas/types";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

/**
 * Generates CAT-style rationales using reasoning graphs for structured elimination.
 *
 * This function addresses the core issue in previous implementations:
 * - The LLM was not forced to use edges - it treated them as context, not instructions
 * - Rationales followed a repetitive pattern: explain correct → pick one wrong → stop
 * - PYQ rationales were shown but their structure wasn't emulated
 *
 * Key improvements in the new prompt:
 *
 * 1. MANDATORY EDGE-DRIVEN ELIMINATION:
 *    - Edges are now binding instructions, not optional context
 *    - Each edge relationship must map to an actual incorrect option
 *    - The LLM is forced to traverse the reasoning graph systematically
 *
 * 2. STRUCTURED ELIMINATION (not answer justification):
 *    - PART 1: Explains why correct option is correct
 *    - PART 2: MUST eliminate at least 2 options using edge relationships
 *    - PART 3: Brief mention of remaining options
 *
 * 3. REASONING PATTERN TEMPLATES:
 *    - Specific templates for different reasoning steps
 *    - e.g., "Capture central thesis" → eliminate too narrow, too broad, etc.
 *    - Ensures variety in elimination logic across questions
 *
 * 4. MENTORING PERSPECTIVE:
 *    - Anticipates common student mistakes
 *    - Shows the reasoning error that leads to each wrong option
 *    - Helps students learn, not just provides answers
 *    - Models CAT reasoning methodology
 *
 * 5. VALIDATION CHECKLIST:
 *    - Ensures all requirements are met before output
 *    - Checks for proper edge usage, elimination depth, tone, precision
 *
 * The prompt uses advanced prompt engineering techniques:
 * - Chain-of-thought for internal reasoning
 * - Few-shot learning from PYQ rationales
 * - Step-by-step structured output
 * - Persona-based writing (CAT expert mentor)
 * - Explicit constraints and validation
 */

interface ReferenceDataSchema {
    passage : Passage;
    questions: Question[];
}

export async function generateRationalesWithEdges(params: {
    passageText: string;
    questions: any[];
    reasoningContexts: Record<string, ReasoningGraphContext>;
    referenceData: ReferenceDataSchema[];
}) {
    const { passageText, questions, reasoningContexts, referenceData } = params;

    const updatedQuestions = [];

    for (const q of questions) {
        const context = reasoningContexts[q.id];
        if (!context) {
            throw new Error(`Missing reasoning context for question ${q.id}`);
        }

        const prompt = `SYSTEM:
You are a CAT VARC expert explaining reasoning to a student.
You understand how students think - where they go wrong, what they miss, what they assume incorrectly.

YOUR PERSONA:
- You are a mentor, not an answer key
- You anticipate and address common student mistakes
- You explain the reasoning path that leads to the correct answer
- You help students recognize their own thinking errors
- Your tone is analytical, precise, and focused on reasoning patterns

CRITICAL MINDSET:
- You are NOT justifying the correct answer
- You are demonstrating the elimination process
- You are showing how to think, not what to think
- Every explanation must model CAT reasoning methodology

---

USER:
Your task is to write a CAT-style rationale that explains the reasoning process.

You are given REFERENCE MATERIAL from actual CAT papers:
- Three past CAT passages with their questions and rationales

IMPORTANT: Study these to understand:
- How CAT rationales are structured
- How elimination is presented
- How reasoning steps are explained
- The academic tone and precision level

---

## REFERENCE MATERIAL (Study These Patterns)

PASSAGE 1 + QUESTIONS + RATIONALES:
${referenceData[0].passage.content}

Questions with Rationales:
${referenceData[0].questions.slice(0, 4).map((q, i) => `
Question ${i + 1}:
${q.question_text}

Options:
${JSON.stringify(q.options, null, 2)}

Correct Answer: ${q.correct_answer.answer}

Rationale:
${q.rationale}
`).join('\n---\n')}

---

PASSAGE 2 + QUESTIONS + RATIONALES:
${referenceData[1].passage.content}

Questions with Rationales:
${referenceData[1].questions.slice(0, 4).map((q, i) => `
Question ${i + 1}:
${q.question_text}

Options:
${JSON.stringify(q.options, null, 2)}

Correct Answer: ${q.correct_answer.answer}

Rationale:
${q.rationale}
`).join('\n---\n')}

---

PASSAGE 3 + QUESTIONS + RATIONALES:
${referenceData[2].passage.content}

Questions with Rationales:
${referenceData[2].questions.slice(0, 4).map((q, i) => `
Question ${i + 1}:
${q.question_text}

Options:
${JSON.stringify(q.options, null, 2)}

Correct Answer: ${q.correct_answer.answer}

Rationale:
${q.rationale}
`).join('\n---\n')}

---

## TARGET QUESTION

PASSAGE:
${passageText}

QUESTION:
${q.question_text}

OPTIONS:
${Object.entries(q.options)
  .map(([key, value]) => `${key}) ${value}`)
  .join('\n')}

CORRECT ANSWER: ${q.correct_answer.answer}

---

## REASONING STRUCTURE (MANDATORY INSTRUCTIONS)

You are given a reasoning graph that maps the thinking process.

PRIMARY REASONING STEP: ${context.primary_node.label}

REASONING PATH (You MUST follow this structure):
${context.edges
  .map((e, i) => `${i + 1}. [${e.relationship}] → ${e.target_node.label} [${e.target_node.type}]`)
  .join('\n')}

---

## MANDATORY RATIONALE STRUCTURE

Your rationale MUST follow this exact elimination-driven structure:

### PART 1: CORRECT OPTION EXPLANATION
- Start by explaining why option ${q.correct_answer.answer} is correct
- Map this to the PRIMARY reasoning step: ${context.primary_node.label}
- Show the logical steps that lead to this option
- Reference the relevant part(s) of the passage
- Be precise and specific

### PART 2: SYSTEMATIC ELIMINATION (MANDATORY)

You MUST explain why AT LEAST 2 incorrect options are wrong, and you MUST use the reasoning graph to guide this:

For EACH incorrect option you explain:
${context.edges.map((e, i) => `
${i + 1}. Use reasoning: "${e.relationship}" → "${e.target_node.label}"
   - Identify which option this reasoning applies to
   - Explain how this option falls into the trap
   - Show the specific reasoning error a student would make
   - Reference the part of the passage that exposes this error`).join('\n')}

IMPORTANT:
- Do NOT randomly pick options - follow the reasoning graph
- Each edge relationship must map to an actual incorrect option
- Explain the thinking error that would lead a student to that option
- Show how the passage actually contradicts or fails to support it

### PART 3: BRIEF MENTION OF REMAINING OPTIONS
- Briefly explain why the remaining option(s) are incorrect
- Do NOT go into as much detail as the mapped eliminations
- Just provide a quick dismissal

---

## REASONING PATTERN TEMPLATES (Use These)

Depending on the PRIMARY reasoning step, use the appropriate template:

IF PRIMARY IS "Capture central thesis":
- Correct option: Identifies the position the passage actually advances
- Eliminate options: Too narrow, too broad, missing the evaluative stance, assuming unstated claims

IF PRIMARY IS "Identify contradictions":
- Correct option: Shows what the passage explicitly contradicts
- Eliminate options: What the passage supports, what the passage leaves open, oversimplifications

IF PRIMARY IS "Evaluate supporting details":
- Correct option: Matches the specific evidence precisely
- Eliminate options: Generalizations, distortions, unsupported extensions, opposite claims

IF PRIMARY IS "Inference":
- Correct option: Derives what must be true based on the passage
- Eliminate options: Literal restatements, extreme interpretations, irrelevant connections, contradictory claims

IF PRIMARY IS "Tone / purpose":
- Correct option: Captures the evaluative stance or intent
- Eliminate options: Opposite stance, neutral description, extreme version, irrelevant purpose

---

## WRITING GUIDELINES

1. TONE:
- Academic, analytical, precise
- Mentor-like - anticipating and addressing student mistakes
- No first-person pronouns (I, my, we)
- No conversational filler
- Direct and focused

2. PRECISION:
- Quote or paraphrase the exact part of the passage
- Be specific about what makes each option correct or incorrect
- Avoid vague language like "because it says so"
- Show, don't just tell

3. REASONING FOCUS:
- Focus on the logical process, not just the outcome
- Explain the step-by-step thinking that leads to the answer
- Address why a wrong option might seem attractive
- Model CAT-style reasoning methodology

4. STRUCTURE:
- Use clear paragraph breaks
- Each paragraph should make one clear point
- Logical flow from correct answer → eliminations
- End with a brief summary if helpful

5. MENTORING APPROACH:
- Anticipate common student mistakes
- Explain the reasoning trap clearly
- Help students recognize their own thinking patterns
- Show the disciplined reasoning that CAT requires

---

## MENTORING PERSPECTIVE (CRITICAL)

Write as if you're teaching a student who:
- Has read the passage carefully
- Has some understanding but makes reasoning errors
- Falls for common traps
- Needs to learn systematic elimination

Your rationale should help them:
- Recognize where they went wrong
- Understand the correct reasoning path
- Learn the CAT methodology
- Avoid similar mistakes in future

---

## FINAL VALIDATION CHECKLIST

Before outputting, verify:

✓ Explains why correct option is correct (not just states it)
✓ Uses the PRIMARY reasoning step to guide explanation
✓ Systematically eliminates AT LEAST 2 incorrect options
✓ Maps eliminations to the reasoning graph edges
✓ Shows the reasoning error for each eliminated option
✓ Mentions remaining options briefly
✓ Academic tone, no first-person pronouns
✓ Precise references to passage text
✓ Models CAT reasoning methodology
✓ Helps student learn, not just provides answer

---

OUTPUT: Write the rationale following the structure above.`;

        const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: "You are a CAT VARC expert mentor. You write elimination-driven rationales that teach reasoning, not just provide answers.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const rationale = completion.choices[0]?.message?.content?.trim();
        if (!rationale) {
            throw new Error("Failed to generate rationale");
        }

        updatedQuestions.push({
            ...q,
            rationale,
            tags: [
                context.primary_node.label,
                ...context.edges.map(e => e.target_node.label),
            ],
            updated_at: new Date().toISOString(),
        });
    }

    return updatedQuestions;
}
