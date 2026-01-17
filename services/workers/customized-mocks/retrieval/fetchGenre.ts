import { supabase } from "../../../config/supabase";

/**
 * Fetches a genre by name.
 * For custom mocks, the genre is specified in the request.
 */
export async function fetchGenreByName(genreName: string) {
    console.log(`🎯 [Genre Fetch] Looking up genre: ${genreName}`);

    const { data, error } = await supabase
        .from('genres')
        .select('*')
        .eq('name', genreName)
        .single();

    if (error) {
        console.error("❌ [Genre Fetch] Error:", error.message);
        throw error;
    }

    if (!data) {
        console.warn(`⚠️ [Genre Fetch] Genre "${genreName}" not found, creating default entry`);
        // Create the genre if it doesn't exist
        const { data: newGenre, error: createError } = await supabase
            .from('genres')
            .insert([{
                name: genreName,
                description: `Custom mock genre: ${genreName}`,
                is_active: true,
            }])
            .select()
            .single();

        if (createError) {
            throw new Error(`Failed to create genre "${genreName}": ${createError.message}`);
        }

        console.log(`✅ [Genre Fetch] Created new genre: ${genreName}`);
        return newGenre;
    }

    console.log(`✅ [Genre Fetch] Found genre: ${data.name}`);
    return data;
}
