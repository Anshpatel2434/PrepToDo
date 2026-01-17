import { supabase } from "../../../config/supabase";

/**
 * Fetches reasoning graph nodes from the database.
 */
export async function fetchNodes() {
    console.log("🧠 [Nodes] Fetching reasoning graph nodes from DB");

    const { data, error } = await supabase
        .from('graph_nodes')
        .select('*')

    if (error) {
        console.error("❌ [Nodes] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Nodes] Loaded ${data?.length} records`);
    return data;
}
