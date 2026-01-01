import { supabase } from "../../config/supabase";

/**
 * Fetches a genre for today's daily content,
 * updates its usage metadata,
 * and returns the selected genre.
 */
export async function fetchGenreForToday() {

    console.log("🚀 [GENRE] Fetching genre start ");
    const now = new Date().toISOString();

    /**
     * STEP 1: Fetch eligible genres
     * Rules:
     * - Active
     * - Not used recently (cooldown respected)
     * - Prefer least-used genres
     */
    // Calculate the cooldown date outside for better readability
    const cooldownDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: genres, error } = await supabase
        .from("genres")
        .select("*")
        .eq("is_active", true)
        // Keep this on one line or ensure no literal newlines exist in the string
        .or(`last_used_daily_at.is.null,last_used_daily_at.lt.${cooldownDate}`)
        .order("daily_usage_count", { ascending: true })
        .order("last_used_daily_at", { ascending: true, nullsFirst: true })
        .limit(1);

    if (error) {
        console.log("[GENRE] error : ", error)
        throw new Error(`Failed to fetch genre: ${error.message}`);
    }

    if (!genres || genres.length === 0) {
        console.log("[GENRE] No eligible genre found for today ")
        throw new Error("No eligible genre found for today");
    }

    const selectedGenre = genres[0];

    console.log("🚀 [GENRE] Genre selected :  ", selectedGenre.name);

    /**
     * STEP 2: Update usage metadata
     */
    const { error: updateError } = await supabase
        .from("genres")
        .update({
            daily_usage_count: selectedGenre.daily_usage_count + 1,
            last_used_daily_at: now,
            updated_at: now,
        })
        .eq("id", selectedGenre.id);

    if (updateError) {
        console.log("[GENRE] error : ", updateError)
        throw new Error(
            `Failed to update genre usage: ${updateError.message}`
        );
    }

    /**
     * STEP 3: Return selected genre
     */
    return {
        id: selectedGenre.id,
        name: selectedGenre.name,
        description: selectedGenre.description,
        cooldown_days: selectedGenre.cooldown_days,
    };
}
