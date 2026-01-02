import { supabase } from "../../../../config/supabase";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 * @param passageIds - An array of 5 strings (IDs)
 */
export async function fetchPassagesData(passageIds: string[]) {
    console.log("📘 [Passages] Fetching multiple IDs:", passageIds);

    const { data, error } = await supabase
        .from("passages") // Updated table name to 'passages'
        .select("*")
        .in("id", passageIds); // Filter rows where 'id' is in the provided array

    if (error) {
        console.error("❌ [Passages] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Passages] Loaded ${data?.length} records`);
    return data;
}