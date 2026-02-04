import { metricMappingJson } from "../../../config/core_metric_reasoning_map_v1_0";
import { db } from "../../db/index.js";
import { graphEdges } from "../../db/schema.js";
import { inArray } from "drizzle-orm";
import { createChildLogger } from "../../common/utils/logger.js";

import {  Node, QuestionMetricTag, ReasoningGraphContext } from "../schemas/types";

const logger = createChildLogger("daily-content");

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

    logger.info(
        `🧩 [Graph] Building reasoning context (questions=${questionTags.length}, nodes=${nodes.length})`
    );

    // Load core metric reasoning map
    const metricMapData = metricMappingJson
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
            logger.warn(`⚠️ [Graph] No nodes found for metrics: ${metricKeys.join(", ")}`);
            result[tag.question_id] = {
                metric_keys: metricKeys,
                nodes: [],
                edges: []
            };
            continue;
        }

        // Fetch outgoing edges for all associated nodes using Drizzle ORM
        const graphEdgesData = await db
            .select()
            .from(graphEdges)
            .where(inArray(graphEdges.sourceNodeId, sourceNodeIds));

        const formattedEdges = graphEdgesData?.map(edge => {
            const sourceNode = nodeLookup.get(edge.sourceNodeId);
            const targetNode = nodeLookup.get(edge.targetNodeId);
            if (!targetNode) {
                logger.warn(`⚠️ [Graph] Edge target node ${edge.targetNodeId} not found`);
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
    }

    logger.info(`✅ [Graph] Context assembled for ${Object.keys(result).length} questions`);
    return result;
}
