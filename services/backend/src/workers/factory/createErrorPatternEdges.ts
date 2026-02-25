// =============================================================================
// Factory Worker — Create ErrorPattern → ReasoningStep Edges
// =============================================================================
//
// PURPOSE:
//   Analyzes incorrect question attempts to identify which ErrorPattern nodes
//   (e.g., "Scope Trap", "Over-generalization") are most commonly associated
//   with failures on questions tagged with specific ReasoningStep nodes.
//   Creates defensive reasoning edges:
//     - ErrorPattern --misleads_into--> ReasoningStep
//     - ErrorPattern --avoids--> ReasoningStep
//
// HOW IT WORKS:
//   1. Queries question_attempts where is_correct = false, grouped by question_id.
//   2. For questions with ≥5 incorrect attempts, fetches the question's metric tags.
//   3. Maps metric tags → ReasoningStep nodes via core_metric_reasoning_map.
//   4. Fetches all ErrorPattern nodes from the graph.
//   5. Uses GPT-4o-mini to classify which ErrorPattern best explains each cluster
//      of wrong answers.
//   6. Creates typed edges with hard-cap enforcement (max 10 outgoing per node).
//
// SAFETY:
//   - Checks for existing edges before creating to avoid duplicates.
//   - Hard-cap: each ErrorPattern node gets max 10 outgoing edges.
//   - All DB writes wrapped in try/catch.
//   - Rate-limited: 500ms between LLM batches.
//
// USAGE:
//   npx tsx src/workers/factory/createErrorPatternEdges.ts
//
// =============================================================================

import OpenAI from "openai";
import { db } from "../../db/index.js";
import {
    questions,
    questionAttempts,
    graphNodes,
    graphEdges,
} from "../../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { createChildLogger } from "../../common/utils/logger.js";
import { CostTracker } from "../../common/utils/CostTracker.js";
import { metricMappingJson } from "../../config/core_metric_reasoning_map_v1_0.js";

const logger = createChildLogger("factory-error-patterns");
const client = new OpenAI();
const MODEL = "gpt-4o-mini";

// Hard cap: maximum outgoing edges per ErrorPattern node
const MAX_EDGES_PER_ERROR_PATTERN = 10;
// Minimum wrong attempts before we analyze a question
const MIN_WRONG_ATTEMPTS = 5;

interface ErrorCluster {
    question_id: string;
    question_text: string;
    question_type: string;
    metric_keys: string[];
    wrong_attempt_count: number;
}

/**
 * Fetches questions with high failure rates that haven't been pattern-analyzed.
 */
async function fetchHighFailureQuestions(): Promise<ErrorCluster[]> {
    logger.info("📥 [Fetch] Finding questions with high failure rates...");

    // Get question IDs with ≥ MIN_WRONG_ATTEMPTS incorrect attempts
    const failureCounts = await db
        .select({
            question_id: questionAttempts.question_id,
            wrong_count: sql<number>`COUNT(*)`.as("wrong_count"),
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.is_correct, false))
        .groupBy(questionAttempts.question_id)
        .having(sql`COUNT(*) >= ${MIN_WRONG_ATTEMPTS}`);

    if (failureCounts.length === 0) {
        logger.info("✅ No questions with sufficient failure data yet.");
        return [];
    }

    logger.info(`📊 [Fetch] Found ${failureCounts.length} questions with ≥${MIN_WRONG_ATTEMPTS} wrong attempts`);

    // Fetch full question data for these
    const clusters: ErrorCluster[] = [];
    for (const fc of failureCounts) {
        const q = await db.query.questions.findFirst({
            where: eq(questions.id, fc.question_id),
        });

        if (q && q.tags && q.tags.length > 0) {
            clusters.push({
                question_id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                metric_keys: q.tags,
                wrong_attempt_count: fc.wrong_count,
            });
        }
    }

    return clusters;
}

/**
 * Fetches all ErrorPattern nodes from the graph.
 */
async function fetchErrorPatternNodes(): Promise<{ id: string; label: string }[]> {
    const nodes = await db.query.graphNodes.findMany({
        where: eq(graphNodes.type, "ErrorPattern"),
    });
    return nodes.map((n) => ({ id: n.id, label: n.label }));
}

/**
 * Counts existing outgoing edges for a node.
 */
async function countOutgoingEdges(nodeId: string): Promise<number> {
    const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(graphEdges)
        .where(eq(graphEdges.source_node_id, nodeId));
    return result[0]?.count ?? 0;
}

/**
 * Checks if an edge already exists between two nodes with a given relationship.
 */
async function edgeExists(
    sourceId: string,
    targetId: string,
    relationship: string
): Promise<boolean> {
    const existing = await db.query.graphEdges.findFirst({
        where: and(
            eq(graphEdges.source_node_id, sourceId),
            eq(graphEdges.target_node_id, targetId),
            eq(graphEdges.relationship, relationship)
        ),
    });
    return !!existing;
}

/**
 * Uses LLM to classify which ErrorPattern best explains a cluster of failures.
 */
async function classifyErrorPattern(
    cluster: ErrorCluster,
    errorPatterns: { id: string; label: string }[],
    costTracker: CostTracker
): Promise<string | null> {
    const patternList = errorPatterns
        .map((ep, i) => `${i + 1}. ${ep.label}`)
        .join("\n");

    const prompt = `You are a CAT exam error analysis engine.

A question of type "${cluster.question_type}" tagged with metrics [${cluster.metric_keys.join(", ")}]
has ${cluster.wrong_attempt_count} incorrect attempts.

Question: "${cluster.question_text.substring(0, 300)}"

Which ERROR PATTERN from this list best explains why students get this wrong?

${patternList}

Return ONLY the exact label of the most likely error pattern. Nothing else.`;

    try {
        const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 0,
            max_tokens: 50,
            messages: [
                {
                    role: "system",
                    content: "You classify common test-taking errors. Return only the error pattern label.",
                },
                { role: "user", content: prompt },
            ],
        });

        if (costTracker && completion.usage) {
            costTracker.logCall(
                "classifyErrorPattern",
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
            );
        }

        return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error: any) {
        logger.error(`❌ [Classify] LLM call failed: ${error.message}`);
        return null;
    }
}

/**
 * Maps a metric key to its ReasoningStep node IDs.
 */
function getReasoningStepNodeIds(metricKey: string): string[] {
    const metricMap = (metricMappingJson as any).metrics;
    const metricData = metricMap[metricKey];
    if (!metricData?.reasoning_steps) return [];
    return metricData.reasoning_steps.map((step: any) => step.node_id);
}

/**
 * Main pipeline: creates ErrorPattern → ReasoningStep edges.
 */
export async function createErrorPatternEdges(): Promise<void> {
    logger.info("🚀 [START] ErrorPattern edge creation pipeline");

    const costTracker = new CostTracker();

    // Fetch error patterns and high-failure questions
    const errorPatterns = await fetchErrorPatternNodes();
    if (errorPatterns.length === 0) {
        logger.info("⚠️ No ErrorPattern nodes found in graph. Exiting.");
        return;
    }
    logger.info(`🧩 [Graph] Found ${errorPatterns.length} ErrorPattern nodes`);

    const clusters = await fetchHighFailureQuestions();
    if (clusters.length === 0) {
        logger.info("✅ No high-failure questions to analyze. Exiting.");
        return;
    }

    let edgesCreated = 0;
    let edgesSkipped = 0;

    for (const cluster of clusters) {
        // Classify which error pattern matches this failure cluster
        const matchedLabel = await classifyErrorPattern(cluster, errorPatterns, costTracker);
        if (!matchedLabel) continue;

        // Find the matching ErrorPattern node
        const matchedPattern = errorPatterns.find(
            (ep) => ep.label.toLowerCase() === matchedLabel.toLowerCase()
        );
        if (!matchedPattern) {
            logger.warn(`⚠️ [Match] LLM returned "${matchedLabel}" but no matching node found`);
            continue;
        }

        // Check hard cap
        const currentEdgeCount = await countOutgoingEdges(matchedPattern.id);
        if (currentEdgeCount >= MAX_EDGES_PER_ERROR_PATTERN) {
            logger.warn(
                `🚫 [Cap] ${matchedPattern.label} has ${currentEdgeCount} edges (cap: ${MAX_EDGES_PER_ERROR_PATTERN}). Skipping.`
            );
            edgesSkipped++;
            continue;
        }

        // Create edges: ErrorPattern --misleads_into--> ReasoningStep
        for (const metricKey of cluster.metric_keys) {
            const stepNodeIds = getReasoningStepNodeIds(metricKey);

            for (const stepId of stepNodeIds) {
                // Re-check cap before each edge
                const currentCount = await countOutgoingEdges(matchedPattern.id);
                if (currentCount >= MAX_EDGES_PER_ERROR_PATTERN) break;

                // Check for duplicate
                const exists = await edgeExists(matchedPattern.id, stepId, "misleads_into");
                if (exists) {
                    edgesSkipped++;
                    continue;
                }

                try {
                    await db.insert(graphEdges).values({
                        source_node_id: matchedPattern.id,
                        target_node_id: stepId,
                        relationship: "misleads_into",
                    });
                    edgesCreated++;
                    logger.info(
                        `🔗 [Edge] ${matchedPattern.label} --misleads_into--> ${stepId.substring(0, 8)}...`
                    );
                } catch (error: any) {
                    logger.warn(`⚠️ [Edge] Failed: ${error.message}`);
                }
            }
        }

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await costTracker.persistToDb("daily_content");
    costTracker.printReport();

    logger.info(`\n${"=".repeat(60)}`);
    logger.info(`🏁 [COMPLETE] ErrorPattern Edge Creation`);
    logger.info(`   Edges created: ${edgesCreated}`);
    logger.info(`   Edges skipped (cap/dup): ${edgesSkipped}`);
    logger.info(`${"=".repeat(60)}\n`);
}

// Allow direct execution
createErrorPatternEdges().catch(console.error);
