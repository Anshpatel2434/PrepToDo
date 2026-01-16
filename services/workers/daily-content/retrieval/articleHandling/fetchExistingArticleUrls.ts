import { supabase } from "../../../../config/supabase";


/**
 * Fetches all existing article URLs to prevent duplication.
 * Fetches more URLs as the database grows to ensure comprehensive exclusion.
 * 
 * @param limit - Maximum number of URLs to fetch (default: 500)
 * @param genre - Optional genre filter to prioritize recent articles from same genre
 * @returns Array of article URLs
 */
export async function getExistingArticleUrls(limit = 500, genre?: string): Promise<string[]> {
    try {
        // If genre is specified, fetch more from that genre to avoid repetition
        if (genre) {
            // Fetch recent articles from the same genre
            const { data: genreData, error: genreError } = await supabase
                .from("articles")
                .select("url")
                .eq("genre", genre)
                .order("created_at", { ascending: false })
                .limit(Math.floor(limit * 0.6)); // 60% from same genre

            if (genreError) {
                console.warn(`⚠️ Failed to fetch genre-specific URLs: ${genreError.message}`);
            }

            // Fetch recent articles from all genres
            const { data: allData, error: allError } = await supabase
                .from("articles")
                .select("url")
                .order("created_at", { ascending: false })
                .limit(Math.floor(limit * 0.4)); // 40% from all genres

            if (allError) {
                console.warn(`⚠️ Failed to fetch all URLs: ${allError.message}`);
            }

            // Combine and deduplicate
            const genreUrls = genreData?.map((row) => row.url) || [];
            const allUrls = allData?.map((row) => row.url) || [];
            const combined = Array.from(new Set([...genreUrls, ...allUrls]));

            console.log(`📚 [Exclusion List] Loaded ${combined.length} existing URLs (${genreUrls.length} from genre "${genre}")`);

            return combined;
        }

        // Default: fetch most recent articles across all genres
        const { data, error } = await supabase
            .from("articles")
            .select("url")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch existing article URLs: ${error.message}`);
        }

        const urls = data.map((row) => row.url);
        console.log(`📚 [Exclusion List] Loaded ${urls.length} existing URLs`);

        return urls;
    } catch (error) {
        console.error(`❌ Error fetching existing article URLs:`, error);
        // Return empty array rather than failing - better to risk a duplicate than fail completely
        return [];
    }
}
