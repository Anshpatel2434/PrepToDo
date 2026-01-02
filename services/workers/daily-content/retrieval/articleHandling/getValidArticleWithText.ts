import { fetchArticleText } from "./fetchArticleText";
import { saveArticleToDB } from "./saveArticle";
import { ArticleOutput, searchWebForArticle } from "./searchWebForArticles";

/**
 * Attempts to find a fetchable article and extract its text.
 * Retries up to maxAttempts times, excluding previously failed URLs.
 */
export async function getValidArticleWithText(
    genre: string,
    maxAttempts = 10
): Promise<{
    articleMeta: ArticleOutput;
    articleText: string;
}> {
    let lastError: unknown = null;

    // Maintain a list of URLs that failed to fetch
    const excludedUrls: string[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let currentUrl: string | null = null;

        try {
            console.log(`🔍 [Article Search] Attempt ${attempt}/${maxAttempts}`);

            // 1. Find article metadata, passing the excluded list
            // Note: Update searchWebForArticle to handle this parameter
            const articleMeta = await searchWebForArticle(genre, excludedUrls);
            currentUrl = articleMeta.url;

            console.log("📄 [Article Meta]", currentUrl);

            // 2. Try fetching article text
            const articleText = await fetchArticleText(currentUrl);

            // 3. Persist metadata ONLY after successful fetch
            await saveArticleToDB(articleMeta);

            console.log("✅ [Article Fetch] Success");

            return { articleMeta, articleText };
        } catch (error) {
            lastError = error;

            // If we managed to get a URL but the fetch/save failed, 
            // add it to the exclusion list so it's not picked again.
            if (currentUrl) {
                excludedUrls.push(currentUrl);
            }

            console.warn(
                `⚠️ [Article Fetch Failed] Attempt ${attempt}:`,
                error instanceof Error ? error.message : error
            );
        }
    }

    throw new Error(
        `❌ Failed to retrieve a valid article after ${maxAttempts} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)
        }`
    );
}