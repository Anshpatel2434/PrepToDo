// =============================================================================
// Persona Forum — Heartbeat Runner
// =============================================================================
//
// The main Runner loop for the AI tutor persona. Follows the Heartbeat Engine
// cycle from the Blueprint (L209-238):
//
//   Wake     → Read persona_state from DB
//   Check    → Check topics_covered, seasonal context, heartbeat count
//   Reason   → Select mood (moodEngine) + topic (topicEngine)
//   Act      → Build S-I-O prompt → GPT-4o-mini → generate post
//   Maintain → Save to forum_posts, update persona_state, write daily log
//   Sleep    → Log HEARTBEAT_OK
//
// This is a STANDALONE function. User triggers it via API endpoint + cron job.
// =============================================================================

import { db } from '../../db/index.js';
import {
    personaState,
    forumThreads,
    forumPosts,
} from '../../db/tables.js';
import { eq, sql, gte } from 'drizzle-orm';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createChildLogger } from '../../common/utils/logger.js';
import { openai } from '../../config/openai.js';
import { generateMoodProfile } from './prompts/moodEngine.js';
import { selectTopic } from './prompts/topicEngine.js';
import { buildPersonaPrompt } from './prompts/buildPersonaPrompt.js';
import { gatherStudentContext } from './context/gatherStudentContext.js';

const logger = createChildLogger('persona-heartbeat');
const MEMORY_DIR = resolve(process.cwd(), 'src', 'workers', 'persona-forum', 'memory');

// ---------------------------------------------------------------------------
// Heartbeat Response Schema (parsed from LLM JSON output)
// ---------------------------------------------------------------------------

interface HeartbeatPostOutput {
    seo_title: string;
    answer_summary: string;
    content: string;
    mood_after: string;
    tags: string[];
    slug: string;
}

// ---------------------------------------------------------------------------
// Main Heartbeat Runner
// ---------------------------------------------------------------------------

export async function runPersonaHeartbeat(): Promise<{
    success: boolean;
    postId?: string;
    error?: unknown;
}> {
    const now = new Date();
    logger.info('💓 [Heartbeat] ═══ WAKE ═══');

    try {
        // ── WAKE: Read persona state ────────────────────────────────────
        const stateRows = await db.select().from(personaState).limit(1);
        if (stateRows.length === 0) {
            throw new Error('No persona_state row found. Run the Phase 3 migration first.');
        }
        const state = stateRows[0];
        logger.info(`💓 [Heartbeat] State loaded: mood=${state.current_mood}, heartbeat=#${state.heartbeat_count}`);

        // ── SAFETY: Cooldown check (prevent accidental rapid-fire calls) ──
        const COOLDOWN_MINUTES = 15;
        if (state.last_heartbeat_at) {
            const minutesSinceLastBeat = (now.getTime() - new Date(state.last_heartbeat_at).getTime()) / 60000;
            if (minutesSinceLastBeat < COOLDOWN_MINUTES) {
                logger.warn(`⚠️ [Heartbeat] Cooldown active — last beat was ${minutesSinceLastBeat.toFixed(1)} min ago (min: ${COOLDOWN_MINUTES}). Skipping.`);
                return { success: false, error: `Cooldown: ${COOLDOWN_MINUTES - Math.floor(minutesSinceLastBeat)} minutes remaining` };
            }
        }

        // ── SAFETY: Daily post cap (max 10 posts per day) ────────────────
        const MAX_DAILY_POSTS = 10;
        const todayStart = new Date(now);
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayPosts = await db.select({ count: sql`count(*)` })
            .from(forumPosts)
            .where(gte(forumPosts.created_at, todayStart));
        const postsToday = Number(todayPosts[0]?.count ?? 0);
        if (postsToday >= MAX_DAILY_POSTS) {
            logger.warn(`⚠️ [Heartbeat] Daily cap reached (${postsToday}/${MAX_DAILY_POSTS}). Skipping.`);
            return { success: false, error: `Daily post cap reached: ${postsToday}/${MAX_DAILY_POSTS}` };
        }

        // ── CHECK: Evaluate current context ─────────────────────────────
        const topicsCovered = state.topics_covered ?? [];
        const heartbeatCount = state.heartbeat_count ?? 0;
        const creativeSeed = state.creative_seed ?? 0;

        logger.info('💓 [Heartbeat] ═══ CHECK ═══');
        logger.info(`📋 Topics covered: ${topicsCovered.length}, Seed: ${creativeSeed}`);

        // ── REASON: Select mood + topic ─────────────────────────────────
        logger.info('💓 [Heartbeat] ═══ REASON ═══');
        const mood = generateMoodProfile(creativeSeed, now);
        const topic = selectTopic(creativeSeed, heartbeatCount, topicsCovered, mood.season);

        // ── ACT: Build prompt + call GPT-4o-mini ────────────────────────
        logger.info('💓 [Heartbeat] ═══ ACT ═══');
        const studentContext = await gatherStudentContext();

        const prompt = buildPersonaPrompt({
            mood,
            topic,
            studentContext,
            heartbeatCount,
        });

        logger.info(`🤖 [Heartbeat] Calling GPT-4o-mini (temp=${prompt.temperature})`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompt.systemMessage },
                { role: 'user', content: prompt.userMessage },
            ],
            temperature: prompt.temperature,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
        });

        const rawOutput = completion.choices[0]?.message?.content;
        if (!rawOutput) {
            throw new Error('GPT-4o-mini returned empty response');
        }

        const postOutput: HeartbeatPostOutput = JSON.parse(rawOutput);
        logger.info(`✍️ [Heartbeat] Post generated: "${postOutput.seo_title}"`);

        // ── MAINTAIN: Save post + update state ──────────────────────────
        logger.info('💓 [Heartbeat] ═══ MAINTAIN ═══');

        // 1. Create or reuse thread
        const threadSlug = `${topic.category}-${now.toISOString().slice(0, 10)}`;
        let thread = await db.query.forumThreads.findFirst({
            where: eq(forumThreads.slug, threadSlug),
        });

        if (!thread) {
            const [newThread] = await db.insert(forumThreads).values({
                title: `${topic.category.replace(/-/g, ' ')} — ${now.toLocaleDateString('en-IN')}`,
                slug: threadSlug,
                category: topic.category,
                seo_description: postOutput.answer_summary,
                schema_type: 'BlogPosting',
            }).returning();
            thread = newThread;
        }

        // 2. Insert forum post
        const [post] = await db.insert(forumPosts).values({
            thread_id: thread.id,
            content: postOutput.content,
            mood: mood.moodLabel,
            answer_summary: postOutput.answer_summary,
            tags: postOutput.tags,
            target_query: topic.targetQuery,
            persona_state_snapshot: {
                mood: mood.moodLabel,
                energy: mood.energy,
                stance: mood.stance,
                season: mood.season,
                heartbeatCount,
            },
        }).returning();

        // 3. Update persona state
        const newTopicsCovered = [...topicsCovered, topic.targetQuery];
        const moodHistoryEntry = {
            mood: mood.moodLabel,
            mood_after: postOutput.mood_after,
            timestamp: now.toISOString(),
        };
        const existingHistory = Array.isArray(state.mood_history)
            ? state.mood_history as any[]
            : [];
        const newMoodHistory = [...existingHistory, moodHistoryEntry].slice(-50); // Keep last 50

        await db.update(personaState)
            .set({
                current_mood: postOutput.mood_after,
                mood_history: newMoodHistory,
                topics_covered: newTopicsCovered,
                last_heartbeat_at: now,
                heartbeat_count: heartbeatCount + 1,
                creative_seed: creativeSeed + 1,
                updated_at: now,
            })
            .where(eq(personaState.id, state.id));

        // 4. Write daily log
        const dailyDir = resolve(MEMORY_DIR, 'daily');
        if (!existsSync(dailyDir)) {
            mkdirSync(dailyDir, { recursive: true });
        }
        const logFile = resolve(dailyDir, `${now.toISOString().slice(0, 10)}.md`);
        const logEntry = `\n## Heartbeat #${heartbeatCount + 1} — ${now.toISOString()}\n\n` +
            `- Mood: ${mood.moodLabel}\n` +
            `- Topic: ${topic.targetQuery}\n` +
            `- Category: ${topic.category}\n` +
            `- Phase: ${topic.contentPhase}\n` +
            `- Season: ${mood.season}\n` +
            `- Post ID: ${post.id}\n` +
            `- Title: ${postOutput.seo_title}\n\n`;
        writeFileSync(logFile, logEntry, { flag: 'a' });

        // ── SLEEP ───────────────────────────────────────────────────────
        logger.info(`💓 [Heartbeat] ═══ SLEEP ═══ HEARTBEAT_OK (post=${post.id})`);

        return { success: true, postId: post.id };

    } catch (error) {
        logger.error({ error }, '❌ [Heartbeat] Heartbeat cycle failed');
        return { success: false, error };
    }
}
