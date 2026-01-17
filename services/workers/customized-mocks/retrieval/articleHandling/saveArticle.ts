import { supabase } from "../../../../config/supabase";
import { v4 as uuidv4 } from 'uuid';
import { Article } from "../../schemas/types";

/**
 * Saves article metadata into the database.
 */
export async function saveArticleToDB(articleMeta: any, genre: string): Promise<Article> {
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
        used_in_custom_exam: false,
        daily_usage_count: 0,
        custom_exam_usage_count: 0,
        last_used_at: null,
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
    return data as Article;
}
