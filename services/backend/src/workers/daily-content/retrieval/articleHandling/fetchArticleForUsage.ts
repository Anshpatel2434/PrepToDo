// =============================================================================
// Daily Content Worker - Fetch Article For Usage
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../../db/index";
import { articles } from "../../../../db/schema";
import { eq, and, lt, isNull, or } from "drizzle-orm";
import { createChildLogger } from "../../../../common/utils/logger.js";
import { TimeService } from "../../../../common/utils/time";

const logger = createChildLogger('article-fetcher');

/**
 * Fetches an article for a given genre and usage type (daily | mock),
 * enforces cooldown-based reuse rules,
 * updates usage metadata,
 * and returns the selected article.
 */
export async function fetchArticleForUsage(params: {
    genre: string;
    usageType: "daily" | "mock";
}) {
    const { genre, usageType } = params;

    logger.info(
        `🚀 [ARTICLE] Fetching article | genre=${genre}, usage=${usageType}`
    );

    const now = TimeService.getISTNow();

    // 100-day cooldown window
    const cooldownDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

    /**
     * STEP 1: Fetch eligible articles
     */
    const allArticles = await db.query.articles.findMany({
        where: and(
            eq(articles.genre, genre),
            eq(articles.is_archived, false)
        ),
    });

    if (!allArticles || allArticles.length === 0) {
        logger.error(`[ARTICLE] No articles found | genre=${genre}`);
        throw new Error(`No articles found for genre=${genre}`);
    }

    /**
     * Filter eligible articles based on usage type
     */
    const eligibleArticles = allArticles.filter((article) => {
        if (usageType === "daily") {
            // For daily: prefer never-used, or allow custom_exam articles past cooldown
            const neverUsed = !article.used_in_daily && !article.used_in_custom_exam;
            const customExamReusable =
                article.used_in_custom_exam &&
                article.last_used_at &&
                new Date(article.last_used_at) < cooldownDate;

            return neverUsed || customExamReusable;
        } else {
            // For mock: prefer never-used, or allow daily articles past cooldown
            const neverUsed = !article.used_in_daily && !article.used_in_custom_exam;
            const dailyReusable =
                article.used_in_daily &&
                article.last_used_at &&
                new Date(article.last_used_at) < cooldownDate;

            return neverUsed || dailyReusable;
        }
    });

    if (eligibleArticles.length === 0) {
        logger.error(
            `[ARTICLE] No eligible articles after filtering | genre=${genre}, usage=${usageType}`
        );
        throw new Error(
            `No eligible articles found for genre=${genre}, usage=${usageType}`
        );
    }

    /**
     * Sort to prioritize:
     * 1. Never-used articles (last_used_at is null)
     * 2. Least-used articles by count
     * 3. Oldest last_used_at
     */
    eligibleArticles.sort((a, b) => {
        // Prioritize never-used
        const aUsed = a.last_used_at !== null;
        const bUsed = b.last_used_at !== null;
        if (aUsed !== bUsed) return aUsed ? 1 : -1;

        // Then by usage count
        const aCount = usageType === "daily"
            ? (a.custom_exam_usage_count ?? 0)
            : (a.daily_usage_count ?? 0);
        const bCount = usageType === "daily"
            ? (b.custom_exam_usage_count ?? 0)
            : (b.daily_usage_count ?? 0);

        if (aCount !== bCount) return aCount - bCount;

        // Then by oldest last_used_at
        if (!a.last_used_at) return -1;
        if (!b.last_used_at) return 1;
        return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime();
    });

    const selectedArticle = eligibleArticles[0];

    logger.info(
        { article: { title: selectedArticle.title, url: selectedArticle.url } },
        "📘 [ARTICLE] Article selected"
    );

    // STEP 2: Update usage metadata
    if (usageType === "daily") {
        await db.update(articles)
            .set({
                used_in_daily: true,
                daily_usage_count: (selectedArticle.daily_usage_count ?? 0) + 1,
                last_used_at: now,
                updated_at: now,
            })
            .where(eq(articles.id, selectedArticle.id));
    } else {
        await db.update(articles)
            .set({
                used_in_custom_exam: true,
                custom_exam_usage_count: (selectedArticle.custom_exam_usage_count ?? 0) + 1,
                last_used_at: now,
                updated_at: now,
            })
            .where(eq(articles.id, selectedArticle.id));
    }

    /**
     * STEP 3: Return selected article
     */
    // Parse semantic ideas if stored as JSON string
    // Parse semantic ideas if stored as JSON string
    const semanticData = typeof selectedArticle.semantic_ideas_and_persona === 'string'
        ? JSON.parse(selectedArticle.semantic_ideas_and_persona)
        : selectedArticle.semantic_ideas_and_persona || {};

    return {
        articleMeta: selectedArticle,
        semantic_ideas: semanticData.semantic_ideas,
        authorial_persona: semanticData.authorial_persona,
    };
}
