import { Passage } from "../../schemas/types";

/**
 * Fetches multiple passages by their IDs.
 */
export async function fetchPassagesData(passageIds: string[]): Promise<Passage[]> {
    console.log(`🔍 [Passages] Fetching ${passageIds.length} passages`);

    // Implementation would call Supabase
    // This is a placeholder
    return [];
}
