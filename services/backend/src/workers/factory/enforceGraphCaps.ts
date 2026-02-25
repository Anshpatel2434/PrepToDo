// =============================================================================
// Factory Worker — Graph Hard-Cap Enforcement & Integrity Check
// =============================================================================
//
// PURPOSE:
//   Prevents the reasoning graph from growing beyond safe limits that would
//   impact database performance and hit free-tier storage caps. This is a
//   CRITICAL maintenance script that should run periodically.
//
// WHAT IT DOES:
//   1. NODE CAP: Warns if graph_nodes count exceeds 5,000.
//   2. EDGE CAP: For each node with >10 outgoing edges, prunes the least-used
//      edges (by relationship type frequency) to bring it back under the limit.
//   3. ORPHAN DETECTION: Identifies graph_nodes with zero edges (isolated nodes).
//   4. STORAGE REPORT: Estimates total graph storage footprint.
//   5. INTEGRITY CHECK: Validates no edges reference non-existent nodes.
//
// SAFETY:
//   - Pruning is conservative: only removes edges that exceed the hard cap.
//   - Pruning uses least-frequent relationship types first (preserves core edges).
//   - All deletions are logged with full audit trail.
//   - Dry-run mode available: set DRY_RUN=true to preview without changes.
//
// USAGE:
//   npx tsx src/workers/factory/enforceGraphCaps.ts
//   DRY_RUN=true npx tsx src/workers/factory/enforceGraphCaps.ts
//
// =============================================================================

import { db } from "../../db/index.js";
import { graphNodes, graphEdges } from "../../db/schema.js";
import { eq, sql, notInArray } from "drizzle-orm";
import { createChildLogger } from "../../common/utils/logger.js";

const logger = createChildLogger("factory-graph-caps");

// Configuration constants
const MAX_NODES = 5000;
const MAX_EDGES_PER_NODE = 10;
const DRY_RUN = process.env.DRY_RUN === "true";

interface GraphStats {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    nodesOverCap: number;
    orphanedNodes: number;
    danglingEdges: number;
    edgesPruned: number;
}

/**
 * Main enforcement pipeline.
 */
export async function enforceGraphCaps(): Promise<GraphStats> {
    logger.info(`🚀 [START] Graph Cap Enforcement (DRY_RUN=${DRY_RUN})`);

    const stats: GraphStats = {
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {},
        nodesOverCap: 0,
        orphanedNodes: 0,
        danglingEdges: 0,
        edgesPruned: 0,
    };

    // =========================================================================
    // STEP 1: Node count check
    // =========================================================================
    logger.info("\n📊 [Step 1/5] Checking node count...");

    const nodeCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(graphNodes);
    stats.totalNodes = nodeCountResult[0]?.count ?? 0;

    if (stats.totalNodes > MAX_NODES) {
        logger.warn(
            `🚨 [CRITICAL] Node count (${stats.totalNodes}) exceeds cap (${MAX_NODES})! ` +
            `Consider archiving stale nodes.`
        );
    } else {
        const utilization = ((stats.totalNodes / MAX_NODES) * 100).toFixed(1);
        logger.info(`✅ [Nodes] ${stats.totalNodes} / ${MAX_NODES} (${utilization}% utilization)`);
    }

    // =========================================================================
    // STEP 2: Node type distribution
    // =========================================================================
    logger.info("\n📊 [Step 2/5] Checking node type distribution...");

    const typeDistribution = await db
        .select({
            type: graphNodes.type,
            count: sql<number>`COUNT(*)`,
        })
        .from(graphNodes)
        .groupBy(graphNodes.type);

    for (const row of typeDistribution) {
        const typeName = row.type || "null";
        stats.nodesByType[typeName] = row.count;
        logger.info(`   ${typeName}: ${row.count}`);
    }

    // =========================================================================
    // STEP 3: Edge cap enforcement — the critical part
    // =========================================================================
    logger.info("\n🔧 [Step 3/5] Enforcing edge caps...");

    const edgeCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(graphEdges);
    stats.totalEdges = edgeCountResult[0]?.count ?? 0;
    logger.info(`   Total edges: ${stats.totalEdges}`);

    // Find nodes with too many outgoing edges
    const overCapNodes = await db
        .select({
            source_node_id: graphEdges.source_node_id,
            edge_count: sql<number>`COUNT(*)`.as("edge_count"),
        })
        .from(graphEdges)
        .groupBy(graphEdges.source_node_id)
        .having(sql`COUNT(*) > ${MAX_EDGES_PER_NODE}`);

    stats.nodesOverCap = overCapNodes.length;

    if (overCapNodes.length === 0) {
        logger.info(`✅ [Edges] All nodes within cap (${MAX_EDGES_PER_NODE} edges/node)`);
    } else {
        logger.warn(`⚠️ [Edges] ${overCapNodes.length} nodes exceed ${MAX_EDGES_PER_NODE} edge cap`);

        for (const node of overCapNodes) {
            const excessCount = node.edge_count - MAX_EDGES_PER_NODE;
            logger.info(
                `   Node ${node.source_node_id.substring(0, 8)}... has ${node.edge_count} edges (${excessCount} over cap)`
            );

            // Get all edges for this node, ordered by relationship frequency
            // (less common relationships get pruned first)
            const nodeEdges = await db
                .select({
                    id: graphEdges.id,
                    relationship: graphEdges.relationship,
                    target_node_id: graphEdges.target_node_id,
                })
                .from(graphEdges)
                .where(eq(graphEdges.source_node_id, node.source_node_id));

            // Count relationship frequency across the entire graph
            const relationshipFrequency = await db
                .select({
                    relationship: graphEdges.relationship,
                    freq: sql<number>`COUNT(*)`,
                })
                .from(graphEdges)
                .groupBy(graphEdges.relationship);

            const freqMap = new Map<string, number>(
                relationshipFrequency.map((r) => [r.relationship, r.freq])
            );

            // Sort edges: least globally-frequent relationship first (prune these)
            const sortedEdges = nodeEdges.sort((a, b) => {
                const freqA = freqMap.get(a.relationship) || 0;
                const freqB = freqMap.get(b.relationship) || 0;
                return freqA - freqB; // Ascending: least frequent first
            });

            // Prune the excess (least frequent edges)
            const edgesToPrune = sortedEdges.slice(0, excessCount);

            for (const edge of edgesToPrune) {
                logger.info(
                    `   🗑️ Pruning: ${edge.relationship} → ${edge.target_node_id.substring(0, 8)}...`
                );

                if (!DRY_RUN) {
                    await db.delete(graphEdges).where(eq(graphEdges.id, edge.id));
                }
                stats.edgesPruned++;
            }
        }
    }

    // =========================================================================
    // STEP 4: Orphan detection
    // =========================================================================
    logger.info("\n🔍 [Step 4/5] Detecting orphaned nodes...");

    // Nodes that appear in neither source nor target of any edge
    const connectedNodeIds = await db
        .selectDistinct({ id: graphEdges.source_node_id })
        .from(graphEdges);
    const targetNodeIds = await db
        .selectDistinct({ id: graphEdges.target_node_id })
        .from(graphEdges);

    const allConnected = new Set([
        ...connectedNodeIds.map((r) => r.id),
        ...targetNodeIds.map((r) => r.id),
    ]);

    const allNodes = await db.select({ id: graphNodes.id }).from(graphNodes);
    const orphans = allNodes.filter((n) => !allConnected.has(n.id));
    stats.orphanedNodes = orphans.length;

    if (orphans.length > 0) {
        logger.warn(`⚠️ [Orphans] ${orphans.length} nodes have zero edges (consider connecting or removing)`);
    } else {
        logger.info(`✅ [Orphans] No orphaned nodes found`);
    }

    // =========================================================================
    // STEP 5: Dangling edge detection
    // =========================================================================
    logger.info("\n🔍 [Step 5/5] Checking edge integrity...");

    const allNodeIds = new Set(allNodes.map((n) => n.id));
    const allEdges = await db
        .select({
            id: graphEdges.id,
            source_node_id: graphEdges.source_node_id,
            target_node_id: graphEdges.target_node_id,
        })
        .from(graphEdges);

    const danglingEdges = allEdges.filter(
        (e) => !allNodeIds.has(e.source_node_id) || !allNodeIds.has(e.target_node_id)
    );
    stats.danglingEdges = danglingEdges.length;

    if (danglingEdges.length > 0) {
        logger.warn(`🚨 [Integrity] ${danglingEdges.length} edges reference non-existent nodes!`);

        if (!DRY_RUN) {
            for (const edge of danglingEdges) {
                await db.delete(graphEdges).where(eq(graphEdges.id, edge.id));
                logger.info(`   🗑️ Removed dangling edge: ${edge.id.substring(0, 8)}...`);
            }
        }
    } else {
        logger.info(`✅ [Integrity] All edges reference valid nodes`);
    }

    // =========================================================================
    // FINAL REPORT
    // =========================================================================
    logger.info(`\n${"=".repeat(60)}`);
    logger.info(`🏁 [COMPLETE] Graph Cap Enforcement Report`);
    logger.info(`${"=".repeat(60)}`);
    logger.info(`   Total nodes:     ${stats.totalNodes} / ${MAX_NODES}`);
    logger.info(`   Total edges:     ${stats.totalEdges}`);
    logger.info(`   Nodes over cap:  ${stats.nodesOverCap}`);
    logger.info(`   Edges pruned:    ${stats.edgesPruned}${DRY_RUN ? " (DRY RUN)" : ""}`);
    logger.info(`   Orphaned nodes:  ${stats.orphanedNodes}`);
    logger.info(`   Dangling edges:  ${stats.danglingEdges}`);
    logger.info(`   Node types:`);
    for (const [type, count] of Object.entries(stats.nodesByType)) {
        logger.info(`     ${type}: ${count}`);
    }
    logger.info(`${"=".repeat(60)}\n`);

    return stats;
}

// Allow direct execution
enforceGraphCaps().catch(console.error);
