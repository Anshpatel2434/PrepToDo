import { db } from "../../../db";
import { genres } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('custom-mock-genre-update');

/**
 * Updates genre usage stats for custom exams.
 * Increments custom_exam_usage_count and updates last_used_custom_exam_at.
 */

export async function updateGenres(genreNames: string[]) {
    const uniqueGenres = Array.from(new Set(genreNames));
    const results = [];

    for (const name of uniqueGenres) {
        try {
            const [updated] = await db.update(genres)
                .set({
                    custom_exam_usage_count: sql`${genres.custom_exam_usage_count} + 1`,
                    last_used_custom_exam_at: new Date(),
                    updated_at: new Date()
                })
                .where(eq(genres.name, name))
                .returning();

            if (!updated) {
                logger.warn(`Genre not found for update: ${name}`);
            }
            results.push(updated);
        } catch (e) {
            logger.error({ error: e instanceof Error ? e.message : String(e), genre: name }, `Failed to update genre`);
        }
    }
    return results;
}
