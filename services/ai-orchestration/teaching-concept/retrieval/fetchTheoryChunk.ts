import { supabase } from "../../config/supabase";

export async function fetchTheoryChunk(theoryId: string) {
	console.log("📘 [Theory] Fetching theory chunk:", theoryId);

	const { data, error } = await supabase
		.from("theory_chunks")
		.select("*")
		.eq("id", theoryId)
		.single();

	if (error) throw error;

	console.log("✅ [Theory] Loaded:", data.concept_title);
	console.log(data);

	return data;
}
