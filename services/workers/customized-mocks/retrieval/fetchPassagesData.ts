import { supabase } from "../../../config/supabase";
import { Passage } from "../schemas/types";

/**
 * Fetches multiple passages from the 'passages' table based on an array of IDs.
 */
export async function fetchPassagesData(passageIds: string[]): Promise<Passage[]> {
    console.log(`🔍 [Passages Fetch] Fetching ${passageIds.length} passages`);

    const { data, error } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);

    if (error) {
        console.error("❌ [Passages Fetch] Error fetching data:", error.message);
        throw error;
    }

    console.log(`✅ [Passages Fetch] Loaded ${data?.length || 0} passages`);
    return data || [];
}
