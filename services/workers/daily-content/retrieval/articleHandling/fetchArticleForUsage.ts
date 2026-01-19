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
     * Rules:
     * - Must match genre
     * - Must not be archived
     * - Prefer never-used articles
     * - Otherwise allow reuse only after cooldown
     */
    const eligibilityFilter =
        usageType === "daily"
            ? `
                and(
                    genre.eq.${genre},
                    is_archived.eq.false,
                    or(
                        and(used_in_daily.eq.false,used_in_custom_exam.eq.false),
                        and(
                            used_in_custom_exam.eq.true,
                            last_used_at.lt.${cooldownDate}
                        )
                    )
                )
              `
            : `
                and(
                    genre.eq.${genre},
                    is_archived.eq.false,
                    or(
                        and(used_in_daily.eq.false,used_in_custom_exam.eq.false),
                        and(
                            used_in_daily.eq.true,
                            last_used_at.lt.${cooldownDate}
                        )
                    )
                )
              `;

    const { data: articles, error } = await supabase
        .from("articles")
        .select("*")
        // NOTE: Supabase .or() accepts a string expression
        .or(eligibilityFilter)
        // Prefer never-used articles
        .order("last_used_at", { ascending: true, nullsFirst: true })
        // Secondary fairness: lower usage count first
        .order(
            usageType === "daily"
                ? "custom_exam_usage_count"
                : "daily_usage_count",
            { ascending: true }
        )
        .limit(1);

    if (error) {
        console.error("[ARTICLE] Fetch error:", error);
        throw new Error(`Failed to fetch article: ${error.message}`);
    }

    if (!articles || articles.length === 0) {
        console.error(
            `[ARTICLE] No eligible article found | genre=${genre}, usage=${usageType}`
        );
        throw new Error(
            `No eligible article found for genre=${genre}, usage=${usageType}`
        );
    }

    const selectedArticle = articles[0];

    console.log(
        "📘 [ARTICLE] Article selected:",
        selectedArticle.title,
        "|",
        selectedArticle.url
    );

    /**
     * STEP 2: Update usage metadata (atomic intent)
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
     * STEP 3: Return selected article (minimal payload)
     */
    return {
        articleMeta : selectedArticle,
        semantic_ideas: selectedArticle.semantic_ideas,
        authorial_persona: selectedArticle.authorial_persona,
    };
}
