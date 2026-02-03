import { db } from "../../../db/index.js";
import { genres } from "../../../db/schema.js";
import { eq, or, isNull, lt, and } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Fetches a genre for today's daily content,
 * updates its usage metadata,
 * and returns the selected genre.
 */
export async function fetchGenreForToday() {
    logger.debug({}, "🚀 [GENRE] Fetching genre start");
    const now = new Date();

    /**
     * STEP 1: Fetch eligible genres
     * Rules:
     * - Active
     * - Not used recently (cooldown respected)
     * - Prefer least-used genres
     */
    // Calculate the cooldown date outside for better readability
    const cooldownDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const selectedGenres = await db
        .select()
        .from(genres)
        .where(
            and(
                eq(genres.isActive, true),
                or(
                    isNull(genres.lastUsedDailyAt),
                    lt(genres.lastUsedDailyAt, cooldownDate)
                )
            )
        )
        .orderBy(genres.dailyUsageCount, genres.lastUsedDailyAt)
        .limit(1);

    if (!selectedGenres || selectedGenres.length === 0) {
        logger.warn({}, "[GENRE] No eligible genre found for today");
        throw new Error("No eligible genre found for today");
    }

    const selectedGenre = selectedGenres[0];

    logger.info({ genreName: selectedGenre.name }, "🚀 [GENRE] Genre selected");

    /**
     * STEP 2: Update usage metadata
     */
    await db
        .update(genres)
        .set({
            dailyUsageCount: (selectedGenre.dailyUsageCount || 0) + 1,
            lastUsedDailyAt: now,
            updatedAt: now,
        })
        .where(eq(genres.id, selectedGenre.id));

    /**
     * STEP 3: Return selected genre
     */
    return {
        id: selectedGenre.id,
        name: selectedGenre.name,
        description: selectedGenre.description,
        cooldown_days: selectedGenre.cooldownDays,
    };
}
