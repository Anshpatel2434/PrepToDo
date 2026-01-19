import { supabase } from "../../../../config/supabase";

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

    const now = new Date().toISOString();

    // 100-day cooldown window
    const cooldownDate = new Date(
        Date.now() - 100 * 24 * 60 * 60 * 1000
    ).toISOString();

    /**
     * STEP 1: Fetch eligible article
     *
     * Strategy:
     * - Base filters: genre match + not archived
     * - Then apply usage-specific eligibility logic in application layer
     */

    let query = supabase
        .from("articles")
        .select("*")
        .eq("genre", genre)
        .eq("is_archived", false);

    // Fetch articles and filter in-memory for complex logic
    const { data: allArticles, error: fetchError } = await query;

    if (fetchError) {
        console.error("[ARTICLE] Fetch error:", fetchError);
        throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!allArticles || allArticles.length === 0) {
        console.error(
            `[ARTICLE] No articles found | genre=${genre}`
        );
        throw new Error(
            `No articles found for genre=${genre}`
        );
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
                new Date(article.last_used_at) < new Date(cooldownDate);

            return neverUsed || customExamReusable;
        } else {
            // For mock: prefer never-used, or allow daily articles past cooldown
            const neverUsed = !article.used_in_daily && !article.used_in_custom_exam;
            const dailyReusable =
                article.used_in_daily &&
                article.last_used_at &&
                new Date(article.last_used_at) < new Date(cooldownDate);

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

    console.log(
        "📘 [ARTICLE] Article selected:",
        selectedArticle.title,
        "|",
        selectedArticle.url
    );

    /**
     * STEP 2: Update usage metadata
     */
    const updatePayload =
        usageType === "daily"
            ? {
                used_in_daily: true,
                daily_usage_count:
                    (selectedArticle.daily_usage_count ?? 0) + 1,
                last_used_at: now,
                updated_at: now,
            }
            : {
                used_in_custom_exam: true,
                custom_exam_usage_count:
                    (selectedArticle.custom_exam_usage_count ?? 0) + 1,
                last_used_at: now,
                updated_at: now,
            };

    const { error: updateError } = await supabase
        .from("articles")
        .update(updatePayload)
        .eq("id", selectedArticle.id);

    if (updateError) {
        console.error("[ARTICLE] Update error:", updateError);
        throw new Error(
            `Failed to update article usage: ${updateError.message}`
        );
    }

    /**
     * STEP 3: Return selected article
     */
    return {
        articleMeta: selectedArticle,
        semantic_ideas: selectedArticle.semantic_ideas_and_persona.semantic_ideas,
        authorial_persona: selectedArticle.semantic_ideas_and_persona.authorial_persona,
    };
}