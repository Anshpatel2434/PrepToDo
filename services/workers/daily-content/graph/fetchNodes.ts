import { supabase } from "../../../config/supabase";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param questionsIds - An array of 5 strings (IDs)
 */
export async function fetchNodes() {
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