import { fetchArticleText } from "./fetchArticleText";
import { saveArticleToDB } from "./saveArticle";
import { ArticleOutput, searchWebForArticle } from "./searchWebForArticles";

/**
 * Attempts to find a fetchable article and extract its text.
 * Retries up to maxAttempts times before failing.
 */
export async function getValidArticleWithText(
    genre: string,
    maxAttempts = 10
): Promise<{
    articleMeta: ArticleOutput;
    articleText: string;
}> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔍 [Article Search] Attempt ${attempt}/${maxAttempts}`);

            // 1. Find article metadata
            const articleMeta = await searchWebForArticle(genre);

            console.log("📄 [Article Meta]", articleMeta.url);

            // 2. Try fetching article text
            const articleText = await fetchArticleText(articleMeta.url);

            // 3. Persist metadata ONLY after successful fetch
            await saveArticleToDB(articleMeta);

            console.log("✅ [Article Fetch] Success");

            return { articleMeta, articleText };
        } catch (error) {
            lastError = error;

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
