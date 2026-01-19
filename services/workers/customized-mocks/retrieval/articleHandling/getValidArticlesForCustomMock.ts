import { Article, ArticleSchema } from "../../schemas/types";
import { fetchArticleText } from "./fetchArticleText";
import { saveArticleToDB } from "./saveArticle";
import { ArticleOutput, searchWebForArticle } from "./searchWebForArticles";
import { supabase } from "../../../../config/supabase";
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches multiple valid articles for custom mock test.
 *
 * Key logic for custom mocks:
 * 1. Check if article used_in_daily → skip
 * 2. Check if article used_in_custom_exam → verify if used by THIS user
 * 3. Only fetch new articles if no valid articles found in DB
 * 4. Maintain usage counts properly
 */
export async function getValidArticlesForCustomMock(params: {
    userId: string;
    genres: string[];
    numArticles: number;
    maxAttempts?: number;
}): Promise<{
    articles: Array<{ articleMeta: Article; articleText: string }>;
    genreNames: string[];
}> {
    const { userId, genres, numArticles, maxAttempts = 5 } = params;

    console.log(`🎯 [Custom Mock] Fetching ${numArticles} articles for user ${userId}`);
    console.log(`   Genres: ${genres.join(", ")}`);

    const fetchedArticles: Array<{ articleMeta: Article; articleText: string }> = [];
    const excludedUrls: string[] = [];
    const genreIndex = { value: 0 };

    for (let attempt = 1; attempt <= maxAttempts && fetchedArticles.length < numArticles; attempt++) {
        const genre = genres[genreIndex.value % genres.length];
        genreIndex.value++;

        try {
            console.log(`\n🔍 [Article Search] Attempt ${attempt}/${maxAttempts} for genre: ${genre}`);

            // Step 1: Try to find existing valid articles in database
            const existingArticle = await findExistingValidArticle({ userId, genre, excludedUrls });

            if (existingArticle) {
                console.log(`✅ [Existing Article] Found valid article: ${existingArticle.title}`);

                // Mark as used by this user for custom exam
                await markArticleUsedForCustomMock(existingArticle.id, userId);

                fetchedArticles.push({
                    articleMeta: existingArticle,
                    articleText: await fetchArticleText(existingArticle.url)
                });

                excludedUrls.push(existingArticle.url);
                continue;
            }

            // Step 2: No valid existing article found, fetch from web
            console.log(`⏳ [Web Search] No valid existing article, searching web...`);

            const articleMeta = await searchWebForArticle(genre, excludedUrls, attempt);
            excludedUrls.push(articleMeta.url);

            console.log(`📄 [Article Meta] Found: ${articleMeta.title}`);
            console.log(`   URL: ${articleMeta.url}`);

            // Step 3: Fetch article text
            console.log(`⏳ [Article Fetch] Downloading article content...`);
            const articleText = await fetchArticleText(articleMeta.url);

            // Validate article text length
            const wordCount = articleText.split(/\s+/).length;
            console.log(`   Word count: ${wordCount}`);

            if (wordCount < 500) {
                throw new Error(`Article too short: ${wordCount} words (minimum 500 required)`);
            }

            if (wordCount > 10000) {
                console.warn(`   ⚠️ Article is very long: ${wordCount} words`);
            }

            // Step 4: Save article with proper flags
            console.log(`💾 [Article Save] Saving to database...`);
            const articleDataWithId = await saveArticleForCustomMock(articleMeta, genre);

            const articleParsed = ArticleSchema.safeParse(articleDataWithId);
            if (!articleParsed.success) {
                console.error("❌ [Validation] Failed for article:", articleParsed.error.issues[0]);
                throw new Error(`Invalid article payload: ${articleParsed.error.issues[0].message}`);
            }

            console.log("✅ [Validation] Article data validated successfully");
            const articleVerified = articleParsed.data;

            fetchedArticles.push({
                articleMeta: articleVerified,
                articleText
            });

            console.log(`✅ [Article Fetch] Success - fetched ${fetchedArticles.length}/${numArticles} articles`);

        } catch (error) {
            console.warn(`⚠️ [Article Fetch Failed] Attempt ${attempt}:`, error instanceof Error ? error.message : String(error));

            // Small delay between retries
            if (attempt < maxAttempts) {
                const delayMs = Math.min(1000 * attempt, 3000);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    if (fetchedArticles.length < numArticles) {
        console.error(`❌ [Article Fetch] Failed to fetch all articles: got ${fetchedArticles.length}/${numArticles}`);
        throw new Error(`Could not fetch enough valid articles. Got ${fetchedArticles.length} of ${numArticles} requested.`);
    }

    console.log(`\n✅ [Article Fetch] Successfully fetched all ${fetchedArticles.length} articles`);

    return {
        articles: fetchedArticles,
        genreNames: fetchedArticles.map(a => a.articleMeta.genre)
    };
}

/**
 * Finds an existing valid article for custom mock.
 * Logic:
 * 1. Must NOT be used_in_daily
 * 2. If used_in_custom_exam, must NOT be used by THIS user
 * 3. Must match requested genre
 * 4. Must not have URL in excluded list
 */
async function findExistingValidArticle(params: {
    userId: string;
    genre: string;
    excludedUrls: string[];
}): Promise<Article | null> {
    const { userId, genre, excludedUrls } = params;

    // First, check if user has any custom exams to get used article IDs
    const { data: userExams, error: examError } = await supabase
        .from('exam_papers')
        .select('used_articles_id')
        .eq('generated_by_user_id', userId)
        .not('used_articles_id', 'is', null);

    if (examError) {
        console.error("❌ [Article Search] Error fetching user exams:", examError.message);
        return null;
    }

    // Collect all article IDs used by this user
    const usedArticleIds = new Set<string>();
    for (const exam of userExams || []) {
        for (const articleId of exam.used_articles_id || []) {
            usedArticleIds.add(articleId);
        }
    }

    console.log(`   User has used ${usedArticleIds.size} articles in custom exams`);

    // Find valid article:
    // - NOT used_in_daily
    // - genre matches
    // - URL not in excluded list
    // - If used_in_custom_exam, NOT used by this user (i.e., not in usedArticleIds)
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('used_in_daily', false)
        .eq('genre', genre)
        .not('url', 'in', `(${excludedUrls.join(',')})`)
        .order('custom_exam_usage_count', { ascending: true })
        .limit(10);

    if (error) {
        console.error("❌ [Article Search] Error fetching articles:", error.message);
        return null;
    }

    // Filter out articles used by this user
    const validArticles = (data || []).filter(article => {
        if (article.used_in_custom_exam) {
            // Article has been used in custom exams
            // Only use if NOT used by this specific user
            return !usedArticleIds.has(article.id);
        }
        // Article has never been used in custom exam - safe to use
        return true;
    });

    if (validArticles.length === 0) {
        console.log(`   No valid existing article found for genre: ${genre}`);
        return null;
    }

    // Return the first valid article
    return validArticles[0] as Article;
}

/**
 * Marks an article as used for custom exam and updates counts.
 */
async function markArticleUsedForCustomMock(articleId: string, userId: string): Promise<void> {
    console.log(`📝 [Article Usage] Marking article ${articleId} as used by user ${userId}`);

    // Get current article data
    const { data: current, error: fetchError } = await supabase
        .from('articles')
        .select('used_in_custom_exam, custom_exam_usage_count')
        .eq('id', articleId)
        .single();

    if (fetchError) {
        console.error("❌ [Article Usage] Error fetching article:", fetchError.message);
        return;
    }

    // Update article
    const { error: updateError } = await supabase
        .from('articles')
        .update({
            used_in_custom_exam: true,
            custom_exam_usage_count: (current?.custom_exam_usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
        })
        .eq('id', articleId);

    if (updateError) {
        console.error("❌ [Article Usage] Error updating article:", updateError.message);
        return;
    }

    console.log(`✅ [Article Usage] Article marked as used`);
}

/**
 * Saves a new article for custom mock with proper flags.
 */
async function saveArticleForCustomMock(articleMeta: ArticleOutput, genre: string,): Promise<any> {
    const now = new Date().toISOString();

    const articleData = {
        id: uuidv4(),
        title: articleMeta.title,
        url: articleMeta.url,
        source_name: articleMeta.source_name,
        author: articleMeta.author,
        published_at: articleMeta.published_at,
        genre: genre,
        topic_tags: articleMeta.topic_tags || [],
        used_in_daily: false,
        used_in_custom_exam: true,
        daily_usage_count: 0,
        custom_exam_usage_count: 1,
        last_used_at: now,
        semantic_hash: null,
        extraction_model: null,
        extraction_version: null,
        is_safe_source: true,
        is_archived: false,
        notes: null,
        created_at: now,
        updated_at: now,
    };

    const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();

    if (error) {
        console.error("❌ [Article Save] Database error:", error.message);
        throw new Error(`Failed to save article: ${error.message}`);
    }

    console.log(`✅ [Article Save] Article saved with ID: ${data.id}`);
    return data;
}
