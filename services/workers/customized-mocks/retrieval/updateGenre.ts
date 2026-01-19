import { supabase } from "../../../config/supabase";

/**
 * Updates genre usage stats for custom exams.
 * Increments custom_exam_usage_count and updates last_used_custom_exam_at.
 * If the genre doesn't exist, it creates it.
 */

export async function updateGenres(genreNames: string[]) {
    const promises = genreNames.map(name =>
        supabase.rpc('increment_genre_custom_usage', { genre_name: name })
    );

    const results = await Promise.all(promises);

    // Check for errors in the array
    results.forEach(res => {
        if (res.error) console.error("Update Error:", res.error.message);
    });

    return results.map(res => res.data);
}