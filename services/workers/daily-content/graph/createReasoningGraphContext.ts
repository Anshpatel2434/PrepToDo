import { supabase } from "../../../ai-orchestration/config/supabase";
import { Edge, Node, QuestionNodeTag, ReasoningGraphContext } from "../schemas/types";

export async function getQuestionGraphContext(
    questionTags: QuestionNodeTag[],
    nodes: Node[]
): Promise<Record<string, ReasoningGraphContext>> {

    // --- LOG 1: Input Check ---
    console.log("🔍 [Phase 1] Inputs received:", {
        tagCount: questionTags.length,
        nodeCount: nodes.length
    });

    const primaryNodeIds = questionTags.map(q => q.primary_node_id);
    console.log("📍 [Phase 2] Extracting Primary Node IDs:", primaryNodeIds);

    if (primaryNodeIds.length === 0) {
        console.warn("⚠️ No primary_node_ids found in questionTags.");
        return {};
    }

    // 2. Query the 'graph_edges' table
    const { data: graphEdges, error } = await supabase
        .from('graph_edges')
        .select('source_node_id, target_node_id, relationship')
        .in('source_node_id', primaryNodeIds);

    // --- LOG 2: Database Results ---
    if (error) {
        console.error("❌ [Phase 3] Supabase Error:", error);
        throw error;
    }
    console.log(`📡 [Phase 3] Database returned ${graphEdges?.length || 0} edges.`);
    if (graphEdges) console.table(graphEdges); // Shows a clean table of the edges in the console

    // 3. Create a map of nodes for O(1) lookup
    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    // 4. Group edges by their source_node_id
    const edgeLookup: Record<string, Edge[]> = {};
    graphEdges?.forEach(edge => {
        if (!edgeLookup[edge.source_node_id]) {
            edgeLookup[edge.source_node_id] = [];
        }
        edgeLookup[edge.source_node_id].push(edge);
    });

    // 5. Build the final Record
    const result: Record<string, ReasoningGraphContext> = {};

    questionTags.forEach((tag) => {
        const primaryNode = nodeMap.get(tag.primary_node_id);

        if (!primaryNode) {
            console.warn(`❓ [Phase 4] Primary Node ID ${tag.primary_node_id} not found in the nodes array provided.`);
            return;
        }

        const rawEdges = edgeLookup[tag.primary_node_id] || [];
        console.log(`🔗 [Phase 5] Processing Q:${tag.question_id}. Found ${rawEdges.length} raw edges for Node:${tag.primary_node_id}`);

        const formattedEdges = rawEdges
            .map(edge => {
                const targetNode = nodeMap.get(edge.target_node_id);
                if (!targetNode) {
                    // This is a common failure point: the edge points to a node that wasn't passed in the 'nodes' array
                    console.error(`🚫 [Phase 5.1] Edge Target Missing: Node ${edge.target_node_id} exists in edges but not in provided nodes list.`);
                }
                return targetNode ? {
                    relationship: edge.relationship,
                    target_node: targetNode
                } : null;
            })
            .filter((e): e is { relationship: string; target_node: Node } => e !== null);

        result[tag.question_id] = {
            primary_node: primaryNode,
            edges: formattedEdges
        };
    });

    console.log("✅ [Final] Context Assembly Complete. Questions mapped:", Object.keys(result));
    return result;
}