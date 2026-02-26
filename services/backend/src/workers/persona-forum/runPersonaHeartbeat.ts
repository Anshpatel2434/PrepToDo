// =============================================================================
// Persona Forum — Heartbeat Runner
// =============================================================================
//
// The main Runner loop for the AI tutor persona. Follows the Heartbeat Engine:
//
//   Wake     → Read persona_state from DB
//   Check    → Check topics_covered, seasonal context, heartbeat count
//   Reason   → Select mood (moodEngine) + topic (topicEngine)
//   Act      → Build S-I-O prompt → GPT-4o-mini → generate post
//   Maintain → Save to forum_posts, update persona_state, log cost
//   Sleep    → Log HEARTBEAT_OK
//
// All state lives in the database — NO filesystem writes.
// =============================================================================

import { db } from '../../db/index.js';
import {
    personaState,
    forumThreads,
    forumPosts,
    adminAiCostLog,
} from '../../db/tables.js';
import { eq, sql, gte } from 'drizzle-orm';
import { createChildLogger } from '../../common/utils/logger.js';
import { openai } from '../../config/openai.js';
import { generateMoodProfile } from './prompts/moodEngine.js';
import { selectTopic } from './prompts/topicEngine.js';
import { buildPersonaPrompt } from './prompts/buildPersonaPrompt.js';
import { gatherStudentContext } from './context/gatherStudentContext.js';

const logger = createChildLogger('persona-heartbeat');

// ---------------------------------------------------------------------------
// GPT-4o-mini pricing (per token)
// ---------------------------------------------------------------------------
const PRICING = {
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
} as const;

function calculateCostUsd(
    model: string,
    inputTokens: number,
    outputTokens: number,
): string {
    const rates = PRICING[model as keyof typeof PRICING] ?? PRICING['gpt-4o-mini'];
    const cost = inputTokens * rates.input + outputTokens * rates.output;
    return cost.toFixed(9);
}

// ---------------------------------------------------------------------------
// Heartbeat Response Schema (parsed from LLM JSON output)
// ---------------------------------------------------------------------------
interface HeartbeatPostOutput {
    seo_title: string;
    seo_query: string;
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

        // ── SAFETY: Cooldown check ──────────────────────────────────────
        // Dev = 1 min, Prod = 15 min (check NODE_ENV)
        const isDev = process.env.NODE_ENV !== 'production';
        const COOLDOWN_MINUTES = isDev ? 1 : 15;
        if (state.last_heartbeat_at) {
            const minutesSinceLastBeat = (now.getTime() - new Date(state.last_heartbeat_at).getTime()) / 60000;
            if (minutesSinceLastBeat < COOLDOWN_MINUTES) {
                logger.warn(`⚠️ [Heartbeat] Cooldown active — ${minutesSinceLastBeat.toFixed(1)} min since last beat. Skipping.`);
                return { success: false, error: `Cooldown: ${Math.ceil(COOLDOWN_MINUTES - minutesSinceLastBeat)} minutes remaining` };
            }
        }

        // ── SAFETY: Daily post cap ──────────────────────────────────────
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

        // ── CHECK ───────────────────────────────────────────────────────
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

        const modelName = 'gpt-4o-mini';
        logger.info(`🤖 [Heartbeat] Calling ${modelName} (temp=${prompt.temperature})`);

        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: prompt.systemMessage },
                { role: 'user', content: prompt.userMessage },
            ],
            temperature: prompt.temperature,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        const rawOutput = completion.choices[0]?.message?.content;
        if (!rawOutput) {
            throw new Error('GPT-4o-mini returned empty response');
        }

        const postOutput: HeartbeatPostOutput = JSON.parse(rawOutput);
        logger.info(`✍️ [Heartbeat] Post generated: "${postOutput.seo_title}"`);

        // ── MAINTAIN: Save post + update state + log cost ────────────────
        logger.info('💓 [Heartbeat] ═══ MAINTAIN ═══');

        // 1. Create or reuse thread
        const threadSlug = `${topic.category}-${now.toISOString().slice(0, 10)}`;
        let thread = await db.query.forumThreads.findFirst({
            where: eq(forumThreads.slug, threadSlug),
        });

        if (!thread) {
            const [newThread] = await db.insert(forumThreads).values({
                title: `${topic.seoQuery} — ${now.toLocaleDateString('en-IN')}`,
                slug: threadSlug,
                category: topic.category,
                seo_description: topic.seoQuery,
                schema_type: 'BlogPosting',
            }).returning();
            thread = newThread;
        }

        // 2. Insert forum post
        const [post] = await db.insert(forumPosts).values({
            thread_id: thread.id,
            content: postOutput.content,
            mood: mood.moodLabel,
            answer_summary: postOutput.content.slice(0, 150),
            tags: postOutput.tags,
            target_query: postOutput.seo_title,
            persona_state_snapshot: {
                mood: mood.moodLabel,
                energy: mood.energy,
                stance: mood.stance,
                season: mood.season,
                heartbeatCount,
            },
        }).returning();

        // 3. Update persona state (DB-backed logs, no filesystem)
        const newTopicsCovered = [...topicsCovered, topic.targetQuery];
        const moodHistoryEntry = {
            mood: mood.moodLabel,
            mood_after: postOutput.mood_after,
            timestamp: now.toISOString(),
        };
        const existingHistory = Array.isArray(state.mood_history)
            ? state.mood_history as any[]
            : [];
        const newMoodHistory = [...existingHistory, moodHistoryEntry].slice(-50);

        // Daily log entry (stored in DB instead of filesystem)
        const logEntry = {
            heartbeat: heartbeatCount + 1,
            timestamp: now.toISOString(),
            mood: mood.moodLabel,
            topic: topic.targetQuery,
            category: topic.category,
            phase: topic.contentPhase,
            postId: post.id,
            title: postOutput.seo_title,
        };
        const existingLogs = Array.isArray((state as any).daily_logs)
            ? (state as any).daily_logs as any[]
            : [];
        const updatedLogs = [...existingLogs, logEntry].slice(-100);

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

        // Update daily_logs separately via raw SQL (column may not be in Drizzle schema yet)
        await db.execute(sql`
            UPDATE persona_state
            SET daily_logs = ${JSON.stringify(updatedLogs)}::jsonb
            WHERE id = ${state.id}
        `);

        // 4. Log AI cost
        const usage = completion.usage;
        if (usage) {
            const inputTokens = usage.prompt_tokens ?? 0;
            const outputTokens = usage.completion_tokens ?? 0;
            const costUsd = calculateCostUsd(modelName, inputTokens, outputTokens);

            await db.insert(adminAiCostLog).values({
                worker_type: 'persona-forum',
                function_name: 'runPersonaHeartbeat',
                model_name: modelName,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost_usd: costUsd,
            });
            logger.info(`💰 [Cost] ${inputTokens} in + ${outputTokens} out = $${costUsd}`);
        }

        // ── SLEEP ───────────────────────────────────────────────────────
        logger.info(`💓 [Heartbeat] ═══ SLEEP ═══ HEARTBEAT_OK (post=${post.id})`);

        return { success: true, postId: post.id };

    } catch (error) {
        logger.error({ error }, '❌ [Heartbeat] Heartbeat cycle failed');
        return { success: false, error };
    }
}
