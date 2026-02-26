// =============================================================================
// Persona Forum Feature — Routes
// =============================================================================
import { Router, Request, Response } from 'express';
import { requireAdmin } from '../admin/middleware/admin.middleware.js';
import { requireAuth } from '../auth/middleware/auth.middleware.js';
import { runPersonaHeartbeat } from '../../workers/persona-forum/runPersonaHeartbeat.js';
import { db } from '../../db/index.js';
import { forumPosts, forumThreads, forumReactions } from '../../db/tables.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import { createChildLogger } from '../../common/utils/logger.js';

const logger = createChildLogger('persona-forum-routes');
const router = Router();

// =============================================================================
// Public Routes — Forum Feed (SEO-crawlable, AEO-optimized)
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
                likes: forumPosts.likes,
                dislikes: forumPosts.dislikes,
                post_type: forumPosts.post_type,
                created_at: forumPosts.created_at,
                thread_id: forumPosts.thread_id,
                thread_slug: forumThreads.slug,
                thread_title: forumThreads.title,
                thread_category: forumThreads.category,
            })
            .from(forumPosts)
            .leftJoin(forumThreads, eq(forumPosts.thread_id, forumThreads.id))
            .orderBy(desc(forumPosts.created_at))
            .limit(20);

        res.json({ success: true, data: { posts } });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch forum feed');
        res.status(500).json({
            success: false,
            error: { code: 'FEED_FETCH_FAILED', message: 'Failed to fetch forum feed' },
        });
    }
});

// GET /api/persona-forum/feed/meta — SEO metadata for feed page
router.get('/feed/meta', async (_req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            data: {
                title: 'AI Tutor\'s Desk — CAT VARC Insights | PrepToDo',
                description: 'Daily expert insights on CAT VARC preparation from PrepToDo\'s AI tutor. RC strategies, para jumble tips, vocabulary hacks, and data-driven study advice.',
                canonical: '/forum',
                ogType: 'website',
                keywords: ['CAT VARC', 'CAT preparation', 'RC strategy', 'para jumble tips', 'VARC preparation', 'CAT exam'],
            },
        });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch feed meta');
        res.status(500).json({
            success: false,
            error: { code: 'META_FETCH_FAILED', message: 'Failed to fetch feed meta' },
        });
    }
});

// GET /api/persona-forum/thread/:slug — Thread by slug with all posts
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
            return res.status(404).json({
                success: false,
                error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
            });
        }

        res.json({ success: true, data: { thread } });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch thread');
        res.status(500).json({
            success: false,
            error: { code: 'THREAD_FETCH_FAILED', message: 'Failed to fetch thread' },
        });
    }
});

// GET /api/persona-forum/thread/:slug/schema — JSON-LD structured data
router.get('/thread/:slug/schema', async (req: Request, res: Response) => {
    try {
        const thread = await db.query.forumThreads.findFirst({
            where: eq(forumThreads.slug, String(req.params.slug)),
            with: {
                posts: {
                    orderBy: desc(forumPosts.created_at),
                    limit: 10,
                },
            },
        });

        if (!thread) {
            return res.status(404).json({
                success: false,
                error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
            });
        }

        // Base Organization schema (always included for entity recognition)
        const organization = {
            '@type': 'Organization',
            'name': 'PrepToDo',
            'url': 'https://preptodo.com',
            'sameAs': [
                'https://www.linkedin.com/company/preptodo',
                'https://twitter.com/preptodo',
            ],
        };

        const author = {
            '@type': 'Person',
            'name': 'PrepToDo\'s AI Tutor',
            'worksFor': organization,
        };

        let schema: Record<string, unknown>;
        const schemaType = thread.schema_type || 'BlogPosting';

        switch (schemaType) {
            case 'FAQPage': {
                const faqEntries = thread.posts.map((p) => ({
                    '@type': 'Question',
                    'name': p.target_query || thread.title,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': p.answer_summary || p.content.slice(0, 300),
                    },
                }));
                schema = {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    'mainEntity': faqEntries,
                };
                break;
            }

            case 'HowTo': {
                const steps = thread.posts.map((p, i) => ({
                    '@type': 'HowToStep',
                    'position': i + 1,
                    'name': p.target_query || `Step ${i + 1}`,
                    'text': p.answer_summary || p.content.slice(0, 300),
                }));
                schema = {
                    '@context': 'https://schema.org',
                    '@type': 'HowTo',
                    'name': thread.title,
                    'description': thread.seo_description || '',
                    'step': steps,
                    'author': author,
                };
                break;
            }

            default: {
                // BlogPosting (default for most posts)
                const latestPost = thread.posts[0];
                schema = {
                    '@context': 'https://schema.org',
                    '@type': 'BlogPosting',
                    'headline': thread.title,
                    'description': thread.seo_description || latestPost?.answer_summary || '',
                    'datePublished': thread.created_at?.toISOString() || new Date().toISOString(),
                    'dateModified': latestPost?.created_at?.toISOString() || thread.created_at?.toISOString(),
                    'author': author,
                    'publisher': organization,
                    'mainEntityOfPage': {
                        '@type': 'WebPage',
                        '@id': `https://preptodo.com/forum/${thread.slug}`,
                    },
                    'keywords': latestPost?.tags?.join(', ') || thread.category,
                    'articleSection': thread.category,
                };
                break;
            }
        }

        res.json({ success: true, data: { schema } });
    } catch (error) {
        logger.error({ error }, 'Failed to generate schema');
        res.status(500).json({
            success: false,
            error: { code: 'SCHEMA_GENERATION_FAILED', message: 'Failed to generate schema' },
        });
    }
});

// =============================================================================
// Authenticated Routes — Reactions
// =============================================================================

// POST /api/persona-forum/post/:id/react — Like or dislike a post
router.post('/post/:id/react', requireAuth, async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const userId = req.user?.userId;
        const { reaction } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }

        if (!reaction || !['like', 'dislike'].includes(reaction)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_REACTION', message: 'Reaction must be "like" or "dislike"' },
            });
        }

        // Check if post exists
        const post = await db.query.forumPosts.findFirst({
            where: eq(forumPosts.id, postId),
        });
        if (!post) {
            return res.status(404).json({
                success: false,
                error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
            });
        }

        // Check for existing reaction by this user
        const existingRows = await db
            .select()
            .from(forumReactions)
            .where(and(
                eq(forumReactions.post_id, postId),
                eq(forumReactions.user_id, userId),
            ))
            .limit(1);
        const existing = existingRows[0] ?? null;

        if (existing) {
            if (existing.reaction === reaction) {
                // Same reaction → remove it (toggle off)
                await db.delete(forumReactions).where(eq(forumReactions.id, existing.id));
                // Decrement counter
                if (reaction === 'like') {
                    await db.execute(sql`UPDATE forum_posts SET likes = GREATEST(likes - 1, 0) WHERE id = ${postId}`);
                } else {
                    await db.execute(sql`UPDATE forum_posts SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = ${postId}`);
                }
                return res.json({ success: true, data: { action: 'removed', reaction } });
            } else {
                // Different reaction → switch it
                await db.update(forumReactions)
                    .set({ reaction })
                    .where(eq(forumReactions.id, existing.id));
                // Swap counters
                if (reaction === 'like') {
                    await db.execute(sql`UPDATE forum_posts SET likes = likes + 1, dislikes = GREATEST(dislikes - 1, 0) WHERE id = ${postId}`);
                } else {
                    await db.execute(sql`UPDATE forum_posts SET dislikes = dislikes + 1, likes = GREATEST(likes - 1, 0) WHERE id = ${postId}`);
                }
                return res.json({ success: true, data: { action: 'switched', reaction } });
            }
        } else {
            // No existing reaction → create new
            await db.insert(forumReactions).values({
                post_id: postId,
                user_id: userId,
                reaction: reaction as string,
            });
            if (reaction === 'like') {
                await db.execute(sql`UPDATE forum_posts SET likes = likes + 1 WHERE id = ${postId}`);
            } else {
                await db.execute(sql`UPDATE forum_posts SET dislikes = dislikes + 1 WHERE id = ${postId}`);
            }
            return res.json({ success: true, data: { action: 'added', reaction } });
        }
    } catch (error) {
        logger.error({ error }, 'Failed to process reaction');
        res.status(500).json({
            success: false,
            error: { code: 'REACTION_FAILED', message: 'Failed to process reaction' },
        });
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
                data: {
                    postId: result.postId,
                    message: 'Heartbeat cycle completed — new post generated',
                },
            });
        } else {
            res.status(500).json({
                success: false,
                error: {
                    code: 'HEARTBEAT_FAILED',
                    message: 'Heartbeat cycle failed',
                    details: String(result.error),
                },
            });
        }
    } catch (error) {
        logger.error({ error }, '❌ Heartbeat endpoint failed');
        res.status(500).json({
            success: false,
            error: { code: 'HEARTBEAT_ERROR', message: 'Heartbeat endpoint failed' },
        });
    }
});

export const personaForumRouter = router;
