import { supabase } from "../../../../config/supabase";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param passageIds - An array of strings (IDs)
 */
export async function fetchPassagesData(passageIds: string[]) {
    const { data, error } = await supabase
        .from("passages")
        .select("*")
        .in("id", passageIds);

    if (error) {
        console.error("❌ [Passages] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Passages] Loaded ${data?.length} records`);
    return data;
}