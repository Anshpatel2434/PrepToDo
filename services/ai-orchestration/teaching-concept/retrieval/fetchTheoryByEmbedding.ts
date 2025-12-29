import { supabase } from "../../config/supabase";

export async function fetchRelevantTheory(conceptQuery: string) {
	console.log(
		"🔍 [Vector Search] Querying theory embeddings for:",
		conceptQuery
	);

	const { data, error } = await supabase.functions.invoke(
		"vector-search-theory",
		{
			body: {
				query: conceptQuery,
				top_k: 5,
			},
		}
	);

	if (error) {
		console.error("❌ [Vector Search] Failed:", error);
		throw error;
	}

	console.log(
		`✅ [Vector Search] Retrieved ${data.matches.length} theory candidates`
	);

	return data.matches; // [{ theory_id, score }]
}
