// =============================================================================
// Daily Content Worker - Create Reasoning Graph Context
// =============================================================================
// Refactored for Drizzle ORM

import { metricMappingJson } from "../../../config/core_metric_reasoning_map_v1_0";
import { db } from "../../../db/index";
import { graphEdges } from "../../../db/schema";
import { inArray } from "drizzle-orm";
import { Node, QuestionMetricTag, ReasoningGraphContext } from "../types";

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
    console.log("---------------------------------------- Graph Input Tags: ", JSON.stringify(questionTags, null, 2));

    // Load core metric reasoning map
    const metricMapData = metricMappingJson;
    const metricMap = (metricMapData as any).metrics;

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
            result[tag.question_id] = {
                metric_keys: metricKeys,
                nodes: [],
                edges: []
            };
            continue;
        }

        console.log(`---------------------------------------- (${tag.question_id}) Associates Nodes Found: `, JSON.stringify(associatedNodes, null, 2));

        // Fetch outgoing edges for all associated nodes using Drizzle
        const edgesData = await db.query.graphEdges.findMany({
            where: inArray(graphEdges.source_node_id, sourceNodeIds),
        });

        const formattedEdges = edgesData?.map(edge => {
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
        }).filter((e): e is any => e !== null) || [];

        result[tag.question_id] = {
            metric_keys: metricKeys,
            nodes: associatedNodes,
            edges: formattedEdges
        };
        console.log(`---------------------------------------- (${tag.question_id}) Final Context Built (Edges: ${formattedEdges.length})`);
    }

    console.log(`✅ [Graph] Context assembled for ${Object.keys(result).length} questions`);
    return result;
}
