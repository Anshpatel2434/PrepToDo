import { supabase } from "../../../../ai-orchestration/config/supabase";


/**
 * Fetches all existing article URLs (or recent ones)
 * to prevent duplication.
 */
export async function getExistingArticleUrls(limit = 200): Promise<string[]> {
    const { data, error } = await supabase
        .from("articles")
        .select("url")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to fetch existing article URLs: ${error.message}`);
    }

    return data.map((row) => row.url);
}
