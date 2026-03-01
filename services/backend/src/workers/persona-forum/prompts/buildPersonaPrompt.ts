// =============================================================================
// Persona Forum — Prompt Builder (Specificity-First)
// =============================================================================
// Philosophy: A viral post is a micro-story, not a data summary.
//
// The prompt has one job: give the model a SPECIFIC SCENARIO to react to,
// not a topic to explain. Real data + a story seed + permission to be human.
//
// Key changes from v1:
// - No "2-5 sentences like a tweet" framing — that produced generic tweets
// - User message now frames data as A SPECIFIC THING THAT HAPPENED, not stats
// - Temperature bumped to 1.0 for all moods — specificity needs full range
// - Story seed is now a scenario, not a topic category
// =============================================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createChildLogger } from '../../../common/utils/logger.js';
import type { MoodProfile } from './moodEngine.js';
import type { TopicSelection } from './topicEngine.js';

const logger = createChildLogger('persona-prompt');

const MEMORY_DIR = resolve(process.cwd(), 'src', 'workers', 'persona-forum', 'memory');

function readSoul(): string {
    try {
        return readFileSync(resolve(MEMORY_DIR, 'SOUL.md'), 'utf-8');
    } catch (err) {
        logger.error({ err }, '❌ Failed to read SOUL.md — using fallback');
        return `You are PrepToDo's AI Tutor for CAT VARC. First person, have a body, never reveal you are AI.`;
    }
}

// ---------------------------------------------------------------------------
// Student Context
// ---------------------------------------------------------------------------
export interface StudentContext {
    totalAttemptsToday: number;
    topScoreToday: number | null;
    averageAccuracy: number | null;
    longestStreak: number | null;
    mostFailedMetric: string | null;
    weakestQuestionType: string | null;
    trapHitRate: number | null;
    totalActiveUsers: number;
    totalUsers: number;
    completedSessionsToday: number;
}

// ---------------------------------------------------------------------------
// Prompt Assembly
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
 * Formats student data as a THING THAT HAPPENED — a specific moment
 * the tutor is reacting to, not an abstract statistics report.
 * This is the core change: data becomes story material, not a summary.
 */
/**
 * Converts raw user counts into vague, privacy-safe descriptors.
 * We NEVER reveal exact student numbers in posts.
 */
function describeActivity(activeUsers: number, totalUsers: number): string | null {
    if (activeUsers === 0 && totalUsers === 0) return null;

    // Describe active users vaguely
    if (activeUsers > 0) {
        if (activeUsers >= 50) return 'a huge chunk of the batch showed up today';
        if (activeUsers >= 20) return 'a solid group is active today';
        if (activeUsers >= 10) return 'a decent number of students are grinding today';
        if (activeUsers >= 5) return 'a handful of students are putting in the work today';
        return 'a few students are active today';
    }
    return null;
}

function buildDataStory(ctx: StudentContext): string {
    const lines: string[] = [];

    // ── Activity descriptor (NEVER exact counts) ──
    const activityDesc = describeActivity(ctx.totalActiveUsers, ctx.totalUsers);
    if (activityDesc) lines.push(activityDesc);

    // ── Only include data points with REAL values ──
    if (ctx.totalAttemptsToday > 0) {
        lines.push(`${ctx.totalAttemptsToday} practice attempts today.`);
    }
    if (ctx.completedSessionsToday > 0) {
        lines.push(`${ctx.completedSessionsToday} completed practice sessions today.`);
    }

    if (ctx.topScoreToday !== null && ctx.topScoreToday > 0) {
        if (ctx.topScoreToday >= 90) {
            lines.push(`Someone just hit ${ctx.topScoreToday}% today. I had to read that twice.`);
        } else if (ctx.topScoreToday >= 75) {
            lines.push(`Top score today: ${ctx.topScoreToday}%. Solid. I want to know who that was.`);
        } else {
            lines.push(`Today's top score was ${ctx.topScoreToday}%. That's where we're at right now.`);
        }
    }

    if (ctx.averageAccuracy !== null) {
        const acc = ctx.averageAccuracy.toFixed(1);
        if (ctx.averageAccuracy < 45) {
            lines.push(`Batch average accuracy: ${acc}%. I'm not panicking. But I'm watching closely.`);
        } else if (ctx.averageAccuracy >= 65) {
            lines.push(`Batch average accuracy: ${acc}%. Something shifted this week.`);
        } else {
            lines.push(`Batch average accuracy: ${acc}% today.`);
        }
    }

    if (ctx.trapHitRate !== null) {
        const trap = ctx.trapHitRate.toFixed(1);
        if (ctx.trapHitRate > 60) {
            lines.push(`${trap}% of wrong answers landed on the trap option today. Over half. I need a minute.`);
        } else if (ctx.trapHitRate > 40) {
            lines.push(`Trap option hit rate: ${trap}%. Still too high. The setters are winning.`);
        } else {
            lines.push(`Trap hit rate: ${trap}% — honestly not bad. The pattern recognition is improving.`);
        }
    }

    if (ctx.longestStreak !== null && ctx.longestStreak > 0) {
        if (ctx.longestStreak >= 30) {
            lines.push(`Someone's streak just hit ${ctx.longestStreak} days. ${ctx.longestStreak} consecutive days. I don't know who you are but you're different.`);
        } else if (ctx.longestStreak >= 14) {
            lines.push(`Longest active streak in the batch: ${ctx.longestStreak} days. That kind of consistency doesn't happen by accident.`);
        } else {
            lines.push(`Current longest streak: ${ctx.longestStreak} days.`);
        }
    }

    if (ctx.mostFailedMetric) {
        lines.push(`The most failed skill today: ${ctx.mostFailedMetric}. Same one as yesterday. We need to talk about this.`);
    }

    if (ctx.weakestQuestionType) {
        lines.push(`Most struggled question type: ${ctx.weakestQuestionType}.`);
    }

    return lines.length > 0
        ? lines.join('\n')
        : 'No practice data yet today. It\'s quiet. Almost too quiet.';
}

export function buildPersonaPrompt(input: PersonaPromptInput): PersonaPromptOutput {
    const { mood, topic, studentContext, heartbeatCount } = input;
    const soul = readSoul();

    const dataStory = buildDataStory(studentContext);

    // System message: soul + the ONE rule about how to write
    // The new rule: write a micro-story, not a data report
    const systemMessage = `${soul}

---

You're posting on PrepToDo's social feed. You just noticed something — a pattern, a moment, a data point — and you grabbed your phone to share it before it leaves your head.

Your current energy: ${mood.energy}. You're feeling ${mood.behaviorCategory}.
This is post #${heartbeatCount + 1} today, so don't repeat what you've already shared.

THE MOST IMPORTANT RULE: Be specific. Generic posts get scrolled past.
The more concrete and specific your post is, the harder it hits.
A post that could be about ANY batch is a bad post. Rewrite it.
Write about THIS moment, THIS data, THIS feeling — right now.

CRITICAL RULES — NEVER VIOLATE:
1. **50 WORDS MAX.** Your post content MUST be 50 words or fewer. No exceptions. Short, punchy, impactful. Count your words.
2. **NEVER mention exact student counts.** Do NOT say how many students are registered, how many are active, or any specific user count number. Use vague language: "some of you", "a bunch of you", "most of the batch", "a few of you", "one of you", etc.
3. **NEVER fabricate or invent data.** You may ONLY reference data points explicitly provided to you below. If a data point is not given, do NOT make it up, do NOT assume it, do NOT invent stories about students doing things that aren't in the data. If there isn't enough data to make a compelling post, write about your feelings, observations, or a general vibe — but NEVER lie about what happened.`;

    // User message: data framed as a story seed, not a stats dump
    const userMessage = `Here's what just happened in the batch:

${dataStory}

The thing on your mind right now: ${topic.targetQuery}

Write one post in your voice. It should feel like you grabbed your phone to share this before you forgot it. Use the micro-story structure if it fits — setup, escalation, punchline/reaction. Or whatever structure makes this specific moment land.

IMPORTANT CONSTRAINTS:
- **50 words MAX** for the "content" field. Count carefully.
- ONLY use the data provided above. Do NOT invent any statistics, streaks, scores, or student behaviors that are not explicitly listed above.
- NEVER state the exact number of registered users or active students. Use vague descriptors instead.
- If the data above is sparse, write about a feeling, a thought, or an observation — NOT fabricated data.

Do NOT:
- Write a bullet-point list of tips
- Start with "So I was analyzing the data..."
- Give a generic motivational statement
- Explain concepts like a textbook
- Mention specific student counts (e.g., "only 4 students", "10 users")
- Make up data that wasn't provided above

Return JSON only:
{
  "seo_title": "your post headline",
  "content": "your post (MAX 50 WORDS)",
  "seo_query": "${topic.seoQuery}",
  "mood_after": "one word",
  "tags": ["tag1", "tag2"],
  "slug": "url-slug"
}`;

    logger.info(`🧠 [Prompt] Built for seed="${topic.targetQuery}" mood=${mood.moodLabel}`);

    return {
        systemMessage,
        userMessage,
        temperature: 1.0, // full range — specificity needs creative freedom
    };
}