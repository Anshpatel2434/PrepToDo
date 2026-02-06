
import { inArray } from "drizzle-orm";
import { db } from "../../../../db";
import { passages } from "../../../../db/schema";

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
        word_count: p.word_count,
        genre: p.genre,
        difficulty: p.difficulty as "easy" | "medium" | "hard",
        source: p.source,
        paper_id: p.paper_id,
        is_daily_pick: p.is_daily_pick ?? false,
        is_featured: p.is_featured ?? false,
        is_archived: p.is_archived ?? false,
        created_at: p.created_at?.toISOString() || new Date().toISOString(),
        updated_at: p.updated_at?.toISOString() || new Date().toISOString(),
    }));
}
