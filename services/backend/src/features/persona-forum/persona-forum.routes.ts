// =============================================================================
// Persona Forum Feature — Routes
// =============================================================================
import { Router, Request, Response } from 'express';
import { requireAdmin } from '../admin/middleware/admin.middleware.js';
import { runPersonaHeartbeat } from '../../workers/persona-forum/runPersonaHeartbeat.js';
import { db } from '../../db/index.js';
import { forumPosts, forumThreads } from '../../db/tables.js';
import { eq, desc } from 'drizzle-orm';
import { createChildLogger } from '../../common/utils/logger.js';

const logger = createChildLogger('persona-forum-routes');
const router = Router();

// =============================================================================
// Public Routes — Forum Feed (SEO-crawlable)
// =============================================================================

// GET /api/persona-forum/feed — Latest forum posts
router.get('/feed', async (_req: Request, res: Response) => {
    try {
        const posts = await db
            .select({
                id: forumPosts.id,
                content: forumPosts.content,
                mood: forumPosts.mood,
                answer_summary: forumPosts.answer_summary,
                tags: forumPosts.tags,
                target_query: forumPosts.target_query,
                created_at: forumPosts.created_at,
                thread_id: forumPosts.thread_id,
            })
            .from(forumPosts)
            .orderBy(desc(forumPosts.created_at))
            .limit(20);

        res.json({ success: true, posts });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch forum feed');
        res.status(500).json({ success: false, error: 'Failed to fetch forum feed' });
    }
});

// GET /api/persona-forum/thread/:slug — Thread by slug
router.get('/thread/:slug', async (req: Request, res: Response) => {
    try {
        const thread = await db.query.forumThreads.findFirst({
            where: eq(forumThreads.slug, String(req.params.slug)),
            with: {
                posts: {
                    orderBy: desc(forumPosts.created_at),
                },
            },
        });

        if (!thread) {
            return res.status(404).json({ success: false, error: 'Thread not found' });
        }

        res.json({ success: true, thread });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch thread');
        res.status(500).json({ success: false, error: 'Failed to fetch thread' });
    }
});

// =============================================================================
// Admin/Cron Routes — Heartbeat Trigger
// =============================================================================

// POST /api/persona-forum/heartbeat — Trigger a heartbeat cycle
// Protected by admin middleware. Wire your cron job to hit this endpoint.
router.post('/heartbeat', requireAdmin, async (_req: Request, res: Response) => {
    try {
        logger.info('💓 [Route] Heartbeat triggered via API');
        const result = await runPersonaHeartbeat();

        if (result.success) {
            res.json({
                success: true,
                postId: result.postId,
                message: 'Heartbeat cycle completed — new post generated',
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Heartbeat cycle failed',
                details: String(result.error),
            });
        }
    } catch (error) {
        logger.error({ error }, '❌ Heartbeat endpoint failed');
        res.status(500).json({ success: false, error: 'Heartbeat endpoint failed' });
    }
});

export const personaForumRouter = router;
