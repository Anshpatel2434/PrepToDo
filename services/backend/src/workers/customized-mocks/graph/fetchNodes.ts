import { db } from "../../../db/index";

/**
 * Fetches all reasoning graph nodes from the database
 */
export async function fetchNodes() {
    console.log("🧠 [Nodes] Fetching reasoning graph nodes from DB");

    const data = await db.query.graphNodes.findMany();

    console.log(`✅ [Nodes] Loaded ${data?.length || 0} records`);
    return data;
}
