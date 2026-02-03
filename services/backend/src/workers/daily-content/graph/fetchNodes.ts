import { db } from "../../db/index.js";
import { graphNodes } from "../../db/schema.js";
import { createChildLogger } from "../../common/utils/logger.js";

const logger = createChildLogger("daily-content");

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param questionsIds - An array of 5 strings (IDs)
 */
export async function fetchNodes() {
    logger.debug("🧠 [Nodes] Fetching reasoning graph nodes from DB");

    const data = await db
        .select()
        .from(graphNodes);

    logger.info(
        { count: data?.length },
        "✅ [Nodes] Loaded records"
    );
    return data;
}