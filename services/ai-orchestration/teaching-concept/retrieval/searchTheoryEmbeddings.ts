import { supabase } from "../../../config/supabase";

export async function searchTheoryEmbeddings(
	queryEmbedding: number[],
	topK = 5
) {
	console.log("📐 [Vector Search] Querying theory embeddings");

	const { data, error } = await supabase.rpc("search_theory_embeddings", {
		query_embedding: queryEmbedding,
		match_count: topK,
	});

	if (error) {
		console.error("❌ [Vector Search] Failed:", error);
		throw error;
	}

	console.log(`✅ [Vector Search] Retrieved ${data.length} candidates`);

	return data; // [{ theory_id, score }]
}