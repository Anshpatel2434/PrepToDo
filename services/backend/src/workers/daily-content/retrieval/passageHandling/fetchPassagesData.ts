import { db } from "../../../db/index.js";
import { passages } from "../../../db/schema.js";
import { inArray } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param passageIds - An array of strings (IDs)
 */
export async function fetchPassagesData(passageIds: string[]) {
    logger.debug(
        { count: passageIds.length },
        "📄 [Passages] Fetching passages from DB"
    );

    const data = await db
        .select()
        .from(passages)
        .where(inArray(passages.id, passageIds));

    logger.info(
        { count: data?.length },
        "✅ [Passages] Loaded records"
    );
    return data;
}