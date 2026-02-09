// =============================================================================
// Daily Content Worker - Fetch Nodes
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('nodes-fetcher');

/**
 * Fetches all reasoning graph nodes from the database
 */
export async function fetchNodes() {
    logger.info("🧠 [Nodes] Fetching reasoning graph nodes from DB");

    const data = await db.query.graphNodes.findMany();

    logger.info(`✅ [Nodes] Loaded ${data?.length || 0} records`);
    return data;
}
