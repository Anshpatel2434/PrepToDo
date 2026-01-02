import { supabase } from "../../../config/supabase";
import { Edge, Node, QuestionNodeTag, ReasoningGraphContext } from "../schemas/types";

/**
 * Assembles reasoning graph context for each question using primary nodes and their edges.
 *
 * This function:
 * 1. Takes question-to-primary-node mappings from the tagging phase
 * 2. Fetches all outgoing edges from each primary node in the reasoning graph
 * 3. Maps each edge to its target node to build the full reasoning path
 *
 * The resulting ReasoningGraphContext for each question contains:
 * - primary_node: The main reasoning step required
 * - edges: Array of connected reasoning steps with their relationship types
 *
 * This context is then used by generateRationalesWithEdges to force
 * elimination-driven explanations that follow the graph structure.
 */
export async function getQuestionGraphContext(
    questionTags: QuestionNodeTag[],
    nodes: Node[]
): Promise<Record<string, ReasoningGraphContext>> {

    console.log(
        `🧩 [Graph] Building reasoning context (questions=${questionTags.length}, nodes=${nodes.length})`
    );

    const primaryNodeIds = questionTags.map(q => q.primary_node_id);

    if (primaryNodeIds.length === 0) {
        console.warn("⚠️ [Graph] No primary_node_ids found in questionTags.");
        return {};
    }

    console.log(`🧩 [Graph] Fetching outgoing edges for ${primaryNodeIds.length} primary nodes`);

    const { data: graphEdges, error } = await supabase
        .from('graph_edges')
        .select('source_node_id, target_node_id, relationship')
        .in('source_node_id', primaryNodeIds);

    if (error) {
        console.error("❌ [Graph] Supabase Error:", error);
        throw error;
    }

    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    const edgeLookup: Record<string, Edge[]> = {};
    graphEdges?.forEach(edge => {
        if (!edgeLookup[edge.source_node_id]) {
            edgeLookup[edge.source_node_id] = [];
        }
        edgeLookup[edge.source_node_id].push(edge);
    });

    const result: Record<string, ReasoningGraphContext> = {};

    questionTags.forEach((tag) => {
        const primaryNode = nodeMap.get(tag.primary_node_id);

        if (!primaryNode) {
            console.warn(`⚠️ [Graph] Primary Node ${tag.primary_node_id} not found`);
            result[tag.question_id] = {
                primary_node: primaryNode || { id: tag?.primary_node_id, label: "MISSING NODE", type: "ReasoningStep" } as Node,
                edges: []
            };
            return;
        }

        const rawEdges = edgeLookup[tag.primary_node_id] || [];

        const formattedEdges = rawEdges
            .map(edge => {
                const targetNode = nodeMap.get(edge.target_node_id);
                if (!targetNode) {
                    console.warn(`⚠️ [Graph] Edge target node ${edge.target_node_id} not found`);
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

    console.log(`✅ [Graph] Context assembled for ${Object.keys(result).length} questions`);
    return result;
}