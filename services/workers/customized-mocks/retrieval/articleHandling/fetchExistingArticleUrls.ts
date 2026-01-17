import { supabase } from "../../../../config/supabase";

/**
 * Fetches all existing article URLs to avoid duplicates.
 */
export async function fetchExistingArticleUrls(): Promise<Set<string>> {
    console.log("🔍 [Existing URLs] Fetching all existing article URLs");

    const { data, error } = await supabase
        .from('articles')
        .select('url');

    if (error) {
        console.error("❌ [Existing URLs] Error fetching URLs:", error.message);
        return new Set();
    }

    const urlSet = new Set(data?.map(a => a.url) || []);
    console.log(`✅ [Existing URLs] Found ${urlSet.size} existing URLs`);
    return urlSet;
}
