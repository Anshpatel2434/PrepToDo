// =============================================================================
// Daily Content Worker - Fetch Genre
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { genres } from "../../../db/schema";
import { eq, lt, isNull, or, asc, and } from "drizzle-orm";

/**
 * Fetches a genre for today's daily content,
 * updates its usage metadata,
 * and returns the selected genre.
 */
export async function fetchGenreForToday() {
    console.log("🚀 [GENRE] Fetching genre start");
    const now = new Date();

    // Calculate the cooldown date (24 hours ago)
    const cooldownDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    /**
     * STEP 1: Fetch eligible genres
     * Rules:
     * - Active
     * - Not used recently (cooldown respected)
     * - Prefer least-used genres
     */
    const eligibleGenres = await db.query.genres.findMany({
        where: and(
            eq(genres.isActive, true),
            or(
                isNull(genres.lastUsedDailyAt),
                lt(genres.lastUsedDailyAt, cooldownDate)
            )
        ),
        orderBy: [asc(genres.dailyUsageCount)],
        limit: 1,
    });

    if (!eligibleGenres || eligibleGenres.length === 0) {
        console.log("[GENRE] No eligible genre found for today");
        throw new Error("No eligible genre found for today");
    }

    const selectedGenre = eligibleGenres[0];
    console.log("🚀 [GENRE] Genre selected:", selectedGenre.name);

    /**
     * STEP 2: Update usage metadata
     */
    await db.update(genres)
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
