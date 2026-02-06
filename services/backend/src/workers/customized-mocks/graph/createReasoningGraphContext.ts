import { db } from "../../../db";
import { graphEdges } from "../../../db/schema";
import { inArray } from "drizzle-orm";
import { metricMappingJson } from "../../../config/core_metric_reasoning_map_v1_0";
import { Node, QuestionMetricTag, ReasoningGraphContext } from "../schemas/types";

/**
 * Assembles reasoning graph context for each question using metric_keys and their mapped reasoning nodes.
 *
 * This function:
 * 1. Takes question-to-metric mappings from the tagging phase
 * 2. Loads the metric-to-reasoning-step map
 * 3. Collects all ReasoningStep nodes associated with the tagged metrics
 * 4. Fetches all outgoing edges from these nodes in the reasoning graph
 * 5. Builds a consolidated context for rationale generation
 */
export async function getQuestionGraphContext(
    questionTags: QuestionMetricTag[],
    nodes: Node[]
): Promise<Record<string, ReasoningGraphContext>> {

    console.log(
        `🧩 [Graph] Building reasoning context (questions=${questionTags.length}, nodes=${nodes.length})`
    );

    // Load core metric reasoning map
    const metricMapData = metricMappingJson as any;
    const metricMap = metricMapData.metrics;

    const result: Record<string, ReasoningGraphContext> = {};
    const nodeLookup = new Map<string, Node>(nodes.map(n => [n.id, n]));

    for (const tag of questionTags) {
        const metricKeys = tag.metric_keys;
        const associatedNodes: { node_id: string; label: string; justification: string }[] = [];
        const sourceNodeIds: string[] = [];

        metricKeys.forEach(key => {
            const metricData = metricMap[key];
            if (metricData && metricData.reasoning_steps) {
                metricData.reasoning_steps.forEach((step: any) => {
                    associatedNodes.push(step);
                    sourceNodeIds.push(step.node_id);
                });
            }
        });

        if (sourceNodeIds.length === 0) {
            console.warn(`⚠️ [Graph] No nodes found for metrics: ${metricKeys.join(", ")}`);

            // Debugging: Check if keys exist in map
            metricKeys.forEach(key => {
                const stepCount = metricMap[key]?.reasoning_steps?.length || 0;
                console.log(`   🔍 Debug: Metric '${key}' has ${stepCount} steps in map. Exists? ${!!metricMap[key]}`);
            });

            result[tag.question_id] = {
                metric_keys: metricKeys,
                nodes: [],
                edges: []
            };
            continue;
        }

        // Fetch outgoing edges for all associated nodes
        const edgesData = await db.query.graphEdges.findMany({
            where: inArray(graphEdges.source_node_id, sourceNodeIds),
            columns: {
                source_node_id: true,
                target_node_id: true,
                relationship: true
            }
        });

        const formattedEdges = edgesData.map(edge => {
            const sourceNode = nodeLookup.get(edge.source_node_id);
            const targetNode = nodeLookup.get(edge.target_node_id);
            if (!targetNode) {
                console.warn(`⚠️ [Graph] Edge target node ${edge.target_node_id} not found`);
            }
            return targetNode ? {
                relationship: edge.relationship,
                source_node_label: sourceNode?.label || "Unknown Node",
                target_node_label: targetNode.label
            } : null;
        }).filter((e): e is any => e !== null);

        result[tag.question_id] = {
            metric_keys: metricKeys,
            nodes: associatedNodes,
            edges: formattedEdges
        };
    }

    console.log(`✅ [Graph] Context assembled for ${Object.keys(result).length} questions`);
    return result;
}
