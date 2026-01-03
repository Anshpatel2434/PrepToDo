// saveArticle.ts
import { supabase } from "../../../../config/supabase";
import { ArticleOutput } from "./searchWebForArticles";

/**
 * Saves article metadata into the database
 */
export async function saveArticleToDB(article: ArticleOutput, genre) {
    const date = new Date()
    const { data, error } = await supabase.from("articles").insert([
        {
            title: article.title,
            url: article.url,
            source_name: article.source_name,
            author: article.author,
            published_at: article.published_at,
            genre: genre,
            topic_tags: article.topic_tags,
            is_safe_source: article.is_safe_source,
            used_in_daily: true,
            used_in_custom_exam: false,
            last_used_at: date.toISOString(),
            daily_usage_count: 1
        },
    ]);

    if (error) {
        // Handle duplicate URL gracefully
        if (error.code === "23505") {
            console.warn("Article already exists:", article.url);
            return null;
        }

        throw new Error(`Failed to save article: ${error.message}`);
    }

    return data;
}
