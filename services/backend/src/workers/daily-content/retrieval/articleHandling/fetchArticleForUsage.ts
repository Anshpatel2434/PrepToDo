// =============================================================================
// Daily Content Worker - Fetch Article For Usage
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../../db/index";
import { articles } from "../../../../db/schema";
import { eq, and, lt, isNull, or } from "drizzle-orm";

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

    console.log(
        `🚀 [ARTICLE] Fetching article | genre=${genre}, usage=${usageType}`
    );

    const now = new Date();

    // 100-day cooldown window
    const cooldownDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

    /**
     * STEP 1: Fetch eligible articles
     */
    const allArticles = await db.query.articles.findMany({
        where: and(
            eq(articles.genre, genre),
            eq(articles.isArchived, false)
        ),
    });

    if (!allArticles || allArticles.length === 0) {
        console.error(`[ARTICLE] No articles found | genre=${genre}`);
        throw new Error(`No articles found for genre=${genre}`);
    }

    /**
     * Filter eligible articles based on usage type
     */
    const eligibleArticles = allArticles.filter((article) => {
        if (usageType === "daily") {
            // For daily: prefer never-used, or allow custom_exam articles past cooldown
            const neverUsed = !article.usedInDaily && !article.usedInCustomExam;
            const customExamReusable =
                article.usedInCustomExam &&
                article.lastUsedAt &&
                new Date(article.lastUsedAt) < cooldownDate;

            return neverUsed || customExamReusable;
        } else {
            // For mock: prefer never-used, or allow daily articles past cooldown
            const neverUsed = !article.usedInDaily && !article.usedInCustomExam;
            const dailyReusable =
                article.usedInDaily &&
                article.lastUsedAt &&
                new Date(article.lastUsedAt) < cooldownDate;

            return neverUsed || dailyReusable;
        }
    });

    if (eligibleArticles.length === 0) {
        console.error(
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
        const aUsed = a.lastUsedAt !== null;
        const bUsed = b.lastUsedAt !== null;
        if (aUsed !== bUsed) return aUsed ? 1 : -1;

        // Then by usage count
        const aCount = usageType === "daily"
            ? (a.customExamUsageCount ?? 0)
            : (a.dailyUsageCount ?? 0);
        const bCount = usageType === "daily"
            ? (b.customExamUsageCount ?? 0)
            : (b.dailyUsageCount ?? 0);

        if (aCount !== bCount) return aCount - bCount;

        // Then by oldest last_used_at
        if (!a.lastUsedAt) return -1;
        if (!b.lastUsedAt) return 1;
        return new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime();
    });

    const selectedArticle = eligibleArticles[0];

    console.log(
        "📘 [ARTICLE] Article selected:",
        selectedArticle.title,
        "|",
        selectedArticle.url
    );

    /**
     * STEP 2: Update usage metadata
     */
    if (usageType === "daily") {
        await db.update(articles)
            .set({
                usedInDaily: true,
                dailyUsageCount: (selectedArticle.dailyUsageCount ?? 0) + 1,
                lastUsedAt: now,
                updatedAt: now,
            })
            .where(eq(articles.id, selectedArticle.id));
    } else {
        await db.update(articles)
            .set({
                usedInCustomExam: true,
                customExamUsageCount: (selectedArticle.customExamUsageCount ?? 0) + 1,
                lastUsedAt: now,
                updatedAt: now,
            })
            .where(eq(articles.id, selectedArticle.id));
    }

    /**
     * STEP 3: Return selected article
     */
    // Parse semantic ideas if stored as JSON string
    const semanticData = typeof selectedArticle.semanticIdeasAndPersona === 'string'
        ? JSON.parse(selectedArticle.semanticIdeasAndPersona)
        : selectedArticle.semanticIdeasAndPersona || {};

    return {
        articleMeta: selectedArticle,
        semantic_ideas: semanticData.semantic_ideas,
        authorial_persona: semanticData.authorial_persona,
    };
}
