import { db } from "../../../db";
import { genres } from "../../../db/schema";
import { eq, sql } from "drizzle-orm";

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
                console.warn(`Genre not found for update: ${name}`);
            }
            results.push(updated);
        } catch (e) {
            console.error(`Failed to update genre ${name}`, e);
        }
    }
    return results;
}
