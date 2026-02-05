// =============================================================================
// Daily Content Worker - Fetch Nodes
// =============================================================================
// Refactored for Drizzle ORM

import { db } from "../../../db/index";
import { graphNodes } from "../../../db/schema";

/**
 * Fetches all reasoning graph nodes from the database
 */
export async function fetchNodes() {
    console.log("🧠 [Nodes] Fetching reasoning graph nodes from DB");

    const data = await db.query.graphNodes.findMany();

    console.log(`✅ [Nodes] Loaded ${data?.length || 0} records`);
    return data;
}
