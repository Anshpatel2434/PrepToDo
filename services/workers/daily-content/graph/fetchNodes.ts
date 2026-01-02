import { supabase } from "../../../ai-orchestration/config/supabase";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param questionsIds - An array of 5 strings (IDs)
 */
export async function fetchNodes() {
    console.log("📘 [Nodes] Fetching all Nodes:");

    const { data, error } = await supabase
        .from('graph_nodes')
        .select('*')

    if (error) {
        console.error("❌ [Questions] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Questions] Loaded ${data?.length} records`);
    return data;
}