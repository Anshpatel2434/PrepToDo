// =============================================================================
// Daily Content Worker - Fetch Passages Data
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../../db/index";
import { passages } from "../../../../db/schema";
import { inArray } from "drizzle-orm";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param passageIds - An array of strings (IDs)
 */
export async function fetchPassagesData(passageIds: string[]) {
    console.log(`📄 [Passages] Fetching ${passageIds.length} passages from DB`);

    if (passageIds.length === 0) {
        console.log("✅ [Passages] No passage IDs provided, returning empty array");
        return [];
    }

    const data = await db.query.passages.findMany({
        where: inArray(passages.id, passageIds),
    });

    console.log(`✅ [Passages] Loaded ${data?.length || 0} records`);

    // Map to Domain Type (snake_case)
    return data.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        word_count: p.wordCount,
        genre: p.genre,
        difficulty: p.difficulty as "easy" | "medium" | "hard",
        source: p.source,
        paper_id: p.paperId,
        is_daily_pick: p.isDailyPick ?? false,
        is_featured: p.isFeatured ?? false,
        is_archived: p.isArchived ?? false,
        created_at: p.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: p.updatedAt?.toISOString() || new Date().toISOString(),
    }));
}
