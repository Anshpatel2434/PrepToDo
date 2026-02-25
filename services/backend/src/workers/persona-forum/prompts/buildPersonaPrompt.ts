// =============================================================================
// Persona Forum — S-I-O Prompt Builder
// =============================================================================
//
// Implements the S-I-O (Setup-Instruction-Output) framework from the Blueprint.
//   Setup (S):       Persona identity from SOUL.md
//   Instruction (I): Mood + topic + student context + methodology
//   Output (O):      Format constraints for machine-readable AEO content
// =============================================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createChildLogger } from '../../../common/utils/logger.js';
import type { MoodProfile } from './moodEngine.js';
import type { TopicSelection } from './topicEngine.js';

const logger = createChildLogger('persona-prompt');

// Resolve the memory directory relative to project root
const MEMORY_DIR = resolve(process.cwd(), 'src', 'workers', 'persona-forum', 'memory');

/**
 * Reads SOUL.md — the persona's core identity.
 * This forms the static Setup (S) layer and benefits from prompt caching.
 */
function readSoul(): string {
    try {
        return readFileSync(resolve(MEMORY_DIR, 'SOUL.md'), 'utf-8');
    } catch (err) {
        logger.error({ err }, '❌ Failed to read SOUL.md — using fallback');
        return `You are PrepToDo's AI Tutor for CAT VARC. You speak in first person, have a body, a life, and never reveal you are an AI. Never reference smoking, alcohol, drugs, or any illegal substance.`;
    }
}

/**
 * Reads MEMORY.md — long-term curated memory.
 */
function readMemory(): string {
    try {
        return readFileSync(resolve(MEMORY_DIR, 'MEMORY.md'), 'utf-8');
    } catch (err) {
        logger.warn('⚠️ MEMORY.md not found — continuing without long-term memory');
        return '';
    }
}

// ---------------------------------------------------------------------------
// Student Context Interface (from gatherStudentContext)
// ---------------------------------------------------------------------------

export interface StudentContext {
    totalAttemptsToday: number;
    topScoreToday: number | null;
    averageAccuracy: number | null;
    longestStreak: number | null;
    mostFailedMetric: string | null;
    trapHitRate: number | null;
    totalActiveUsers: number;
}

// ---------------------------------------------------------------------------
// S-I-O Prompt Assembly
// ---------------------------------------------------------------------------

export interface PersonaPromptInput {
    mood: MoodProfile;
    topic: TopicSelection;
    studentContext: StudentContext;
    heartbeatCount: number;
}

export interface PersonaPromptOutput {
    systemMessage: string;
    userMessage: string;
    temperature: number;
}

/**
 * Builds the complete S-I-O prompt for the persona's next forum post.
 */
export function buildPersonaPrompt(input: PersonaPromptInput): PersonaPromptOutput {
    const { mood, topic, studentContext, heartbeatCount } = input;

    // ── Setup (S): Static persona identity ──────────────────────────────
    const soul = readSoul();
    const memory = readMemory();

    const systemMessage = `${soul}

---
## Current Long-Term Memory
${memory || '(No long-term memory yet — this is a fresh start)'}

---
## Your Current Mood
- Energy: ${mood.energy}
- Stance: ${mood.stance}
- Expertise mode: ${mood.expertise}
- Narrative style: ${mood.narrative}
- POV lens: ${mood.lens}
- Season: ${mood.season}

## Embodied Behavior Direction
For this post, lean into a **"${mood.behaviorCategory}"** vibe.
Don't use that label literally — express it naturally in YOUR voice.
Be wildly creative. Refer to SOUL.md for your personality range.
Every post should feel unique and surprising.
`;

    // ── Instruction (I): Dynamic task + context ─────────────────────────
    // Fill in template placeholders in behaviors with real data
    const ctx = studentContext;
    const filledContext = [
        `Platform stats today:`,
        `- Total attempts: ${ctx.totalAttemptsToday}`,
        `- Active users: ${ctx.totalActiveUsers}`,
        ctx.topScoreToday !== null ? `- Highest score today: ${ctx.topScoreToday}%` : null,
        ctx.averageAccuracy !== null ? `- Average accuracy: ${ctx.averageAccuracy.toFixed(1)}%` : null,
        ctx.longestStreak !== null ? `- Longest active streak: ${ctx.longestStreak} days` : null,
        ctx.mostFailedMetric ? `- Most struggled metric: ${ctx.mostFailedMetric}` : null,
        ctx.trapHitRate !== null ? `- Trap option hit rate: ${ctx.trapHitRate.toFixed(1)}%` : null,
    ].filter(Boolean).join('\n');

    const userMessage = `## Your Task

Write a forum post that answers this specific Missing Middle question:
**"${topic.targetQuery}"**

Content phase: ${topic.contentPhase}
Category: ${topic.category}
Post number: #${heartbeatCount + 1}

## Student Data to Reference (anonymously — NEVER use names)
${filledContext}

## Writing Rules
1. Start with an "Answer-First" block: 40-60 words directly answering the target query
2. Use question-based subheadings that mirror how students naturally ask
3. Weave in your current mood and at least ONE embodied behavior naturally
4. Include specific numbers from the student data above
5. End with a practical, bookmarkable takeaway
6. Keep total length 200-400 words
7. Use markdown formatting (headings, bold, emojis)
8. NEVER mention student names — use "one of you", "someone here", "a student"
9. NEVER reveal you are an AI — you are the tutor, period

## Output Format
Respond in this exact JSON format:
{
  "seo_title": "SEO-optimized title (60 chars max) targeting the query",
  "answer_summary": "40-60 word Answer-First block",
  "content": "Full post content in markdown (200-400 words)",
  "mood_after": "Your mood label after writing this (single word)",
  "tags": ["tag1", "tag2", ...],
  "slug": "url-friendly-slug-for-this-post"
}`;

    logger.info(`🧠 [Prompt] Built S-I-O for topic="${topic.targetQuery}" mood=${mood.moodLabel}`);

    return {
        systemMessage,
        userMessage,
        temperature: mood.temperature,
    };
}
