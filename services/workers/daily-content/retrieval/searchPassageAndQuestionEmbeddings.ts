import { supabase } from "../../../ai-orchestration/config/supabase";

export async function searchPassageAndQuestionEmbeddings(
	queryEmbedding: number[],
	topK = 5
) {
	console.log("📐 [Vector Search] Querying passages embeddings");

	const { data: passageData, error: passageError } = await supabase.rpc("search_passage_embeddings", {
		query_embedding: queryEmbedding,
		match_count: topK,
	});

	if (passageError) {
		console.error("❌ [Vector Search] Failed for passages:", passageError);
		throw passageError;
	}

	console.log(`✅ [Vector Search] Retrieved ${passageData.length} candidates for passages`);

	console.log("📐 [Vector Search] Querying questions embeddings");

	const { data: questionsData, error: questionsError } = await supabase.rpc("search_question_embeddings_by_type", {
		query_embedding: queryEmbedding,
		match_per_type: topK,
	});

	if (questionsError) {
		console.error("❌ [Vector Search] Failed for questions:", questionsError);
		throw questionsError;
	}

	console.log(`✅ [Vector Search] Retrieved ${questionsData.length} candidates for questions`);

	return {
		passages: passageData,
		questions: questionsData
	};
}
