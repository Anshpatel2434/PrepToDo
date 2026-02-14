// =============================================================================
// Daily Content Worker - Fetch Genre
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { genres } from "../../../db/schema";
import { eq, lt, isNull, or, asc, and } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";
import { TimeService } from "../../../common/utils/time";

const logger = createChildLogger('fetch-genre-today');

/**
 * Fetches a genre for today's daily content,
 * updates its usage metadata,
 * and returns the selected genre.
 */
export async function fetchGenreForToday() {
    logger.info("Fetching genre start");
    const now = TimeService.getISTNow();

    // Calculate the cooldown date (24 hours ago)
    const cooldownDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    /**
     * STEP 1: Fetch eligible genres
     * Rules:
     * - Active
     * - Not used recently (cooldown respected)
     * - Prefer least-used genres
     */
    const eligibleGenres = await db.query.genres.findMany({
        where: and(
            eq(genres.is_active, true),
            or(
                isNull(genres.last_used_daily_at),
                lt(genres.last_used_daily_at, cooldownDate)
            )
        ),
        orderBy: [asc(genres.daily_usage_count)],
        limit: 1,
    });

    if (!eligibleGenres || eligibleGenres.length === 0) {
        logger.info("No eligible genre found for today");
        throw new Error("No eligible genre found for today");
    }

    const selectedGenre = eligibleGenres[0];
    logger.info({ genreName: selectedGenre.name }, "Genre selected");

    /**
     * STEP 2: Update usage metadata
     */
    await db.update(genres)
        .set({
            daily_usage_count: (selectedGenre.daily_usage_count || 0) + 1,
            last_used_daily_at: now,
            updated_at: now,
        })
        .where(eq(genres.id, selectedGenre.id));

    /**
     * STEP 3: Return selected genre
     */
    return {
        id: selectedGenre.id,
        name: selectedGenre.name,
        description: selectedGenre.description,
        cooldown_days: selectedGenre.cooldown_days,
    };
}
