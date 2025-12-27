import { supabase } from "../config/supabase";

export async function expandConceptGraph(conceptNodeId: string) {
	console.log("🧠 [Graph Traversal] Expanding graph for node:", conceptNodeId);

	const { data: edges, error } = await supabase
		.from("graph_edges")
		.select(
			`
            relationship,
            source_node_id
            `
		)
		.eq("target_node_id", conceptNodeId);

	if (error) {
		console.error("❌ [Graph Traversal] Edge fetch failed:", error);
		throw error;
	}

	console.log(
		`🔗 [Graph Traversal] Found ${edges.length} outgoing edges and they are  : `
	);
	console.log(edges);

	if (edges.length === 0) return [];

	const targetNodeIds = edges.map((e) => e.source_node_id);

	const { data: nodes, error: nodeError } = await supabase
		.from("graph_nodes")
		.select("id, label, type")
		.in("id", targetNodeIds);

	if (nodeError) {
		console.error("❌ [Graph Traversal] Node fetch failed:", nodeError);
		throw nodeError;
	}

	console.log(
		`📚 [Graph Traversal] Loaded ${nodes.length} target nodes and they are : `
	);
	console.log(nodes);

	return edges.map((edge) => {
		const node = nodes.find((n) => n.id === edge.source_node_id);
		return {
			relationship: edge.relationship,
			label: node?.label,
			type: node?.type,
		};
	});
}
