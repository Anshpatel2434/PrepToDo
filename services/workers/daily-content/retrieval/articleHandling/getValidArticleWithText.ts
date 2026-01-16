import { Article, ArticleSchema } from "../../schemas/types";
import { fetchArticleText } from "./fetchArticleText";
import { saveArticleToDB } from "./saveArticle";
import { ArticleOutput, searchWebForArticle } from "./searchWebForArticles";

/**
 * Attempts to find a fetchable article and extract its text.
 * Retries up to maxAttempts times, excluding previously failed URLs.
 * Uses diverse search strategies across attempts to maximize uniqueness.
 */
export async function getValidArticleWithText(
    genre: string,
    maxAttempts = 10
): Promise<{
    articleMeta: Article;
    articleText: string;
}> {
    let lastError: unknown = null;

    // Maintain a list of URLs that failed to fetch or were duplicates
    const excludedUrls: string[] = [];

    // Track different types of failures for better debugging
    const failureReasons: string[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let currentUrl: string | null = null;
        let articleMeta: ArticleOutput | null = null;

        try {
            console.log(`🔍 [Article Search] Attempt ${attempt}/${maxAttempts} for genre: ${genre}`);
            if (excludedUrls.length > 0) {
                console.log(`   Excluding ${excludedUrls.length} previously failed URLs`);
            }

            // 1. Find article metadata with diverse search strategy
            // Pass attempt number to enable different search strategies
            articleMeta = await searchWebForArticle(genre, excludedUrls, attempt);
            currentUrl = articleMeta.url;

            console.log(`📄 [Article Meta] Found: ${articleMeta.title}`);
            console.log(`   URL: ${currentUrl}`);
            console.log(`   Source: ${articleMeta.source_name}`);

            // 2. Try fetching article text
            console.log(`⏳ [Article Fetch] Downloading article content...`);
            const articleText = await fetchArticleText(currentUrl);

            // Validate article text length
            const wordCount = articleText.split(/\s+/).length;
            console.log(`   Word count: ${wordCount}`);

            if (wordCount < 500) {
                throw new Error(`Article too short: ${wordCount} words (minimum 500 required)`);
            }

            if (wordCount > 10000) {
                console.warn(`   ⚠️ Article is very long: ${wordCount} words`);
            }

            // 3. Persist metadata ONLY after successful fetch
            console.log(`💾 [Article Save] Saving to database...`);
            const articleDataWithId = await saveArticleToDB(articleMeta, genre);

            const articleParsed = ArticleSchema.safeParse(articleDataWithId);
            if (!articleParsed.success) {
                console.error("❌ [Validation] Failed for article:", articleParsed.error.issues[0]);
                throw new Error(`Invalid article payload: ${articleParsed.error.issues[0].message}`);
            }

            console.log("✅ [Validation] Article data validated successfully");
            const articleVerified = articleParsed.data;

            console.log("✅ [Article Fetch] Success - returning article");
            console.log(`   Title: ${articleVerified.title}`);
            console.log(`   Genre: ${articleVerified.genre}`);
            console.log(`   Word count: ${wordCount}`);

            return { articleMeta: articleVerified, articleText };

        } catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Track failure reason
            failureReasons.push(`Attempt ${attempt}: ${errorMessage}`);

            // If we managed to get a URL but the fetch/save failed, 
            // add it to the exclusion list so it's not picked again.
            if (currentUrl) {
                excludedUrls.push(currentUrl);
                console.warn(`⚠️ [Article Fetch Failed] Adding to exclusion list: ${currentUrl}`);
            }

            console.warn(`⚠️ [Article Fetch Failed] Attempt ${attempt}/${maxAttempts}:`, errorMessage);

            // Add a small delay between retries to avoid rate limiting
            if (attempt < maxAttempts) {
                const delayMs = Math.min(1000 * attempt, 5000); // Progressive delay, max 5s
                console.log(`   Waiting ${delayMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    // Provide detailed error information
    console.error(`❌ [Article Fetch] Failed after ${maxAttempts} attempts`);
    console.error(`   Genre: ${genre}`);
    console.error(`   Excluded URLs: ${excludedUrls.length}`);
    console.error(`   Failure reasons:`);
    failureReasons.forEach((reason, idx) => {
        console.error(`     ${idx + 1}. ${reason}`);
    });

    throw new Error(
        `❌ Failed to retrieve a valid article after ${maxAttempts} attempts for genre "${genre}". ` +
        `Tried ${excludedUrls.length} different URLs. ` +
        `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
}
