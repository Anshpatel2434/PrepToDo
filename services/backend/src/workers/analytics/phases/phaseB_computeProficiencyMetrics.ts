import { logger } from "../../../common/utils/logger.js";
import {
    AttemptDatum,
    UserMetricProficiency,
    MetricMapping
} from "../types.js";
import { v4 as uuidv4 } from 'uuid';

export function phaseB_computeProficiencyMetrics(
    userId: string,
    sessionId: string,
    dataset: AttemptDatum[],
    mapping: MetricMapping
): UserMetricProficiency[] {

    logger.info('📊 [Phase B] Computing User Metric Proficiency');

    // Temporary storage for aggregation
    // Key: "dimension_type|dimension_key"
    const aggregation = new Map<string, {
        correct: number;
        total: number;
        totalConfidence: number;
        confidenceCount: number;
    }>();

    // Helper to update the aggregation map
    const update = (type: string, key: string, isCorrect: boolean, confidence: number | null | undefined) => {
        const compositeKey = `${type}|${key}`;
        if (!aggregation.has(compositeKey)) {
            aggregation.set(compositeKey, { correct: 0, total: 0, totalConfidence: 0, confidenceCount: 0 });
        }

        const stats = aggregation.get(compositeKey)!;
        stats.total += 1;
        stats.correct += isCorrect ? 1 : 0;

        if (confidence !== null && confidence !== undefined) {
            stats.totalConfidence += confidence; // Assuming scale 1-3
            stats.confidenceCount += 1;
        }
    };

    // 1. Process Dataset
    for (const attempt of dataset) {
        // Dimension: question_type
        update("question_type", attempt.question_type, attempt.correct, attempt.confidence_level);

        // Dimension: genre
        if (attempt.genre) {
            update("genre", attempt.genre, attempt.correct, attempt.confidence_level);
        }

        // Dimension: difficulty
        if (attempt.difficulty) {
            update("difficulty", attempt.difficulty, attempt.correct, attempt.confidence_level);
        }

        // Dimension: reasoning_step & core_metric
        for (const metric_key of attempt.metric_keys) {
            // Update core_metric directly
            update("core_metric", metric_key, attempt.correct, attempt.confidence_level);

            // Look up for the reasoning nodes associated with this metric_key
            const linkedNodes = mapping.metricToNodes.get(metric_key);
            if (linkedNodes) {
                for (const nodeLabel of Array.from(linkedNodes)) {
                    update("reasoning_step", nodeLabel, attempt.correct, attempt.confidence_level);
                }
            }
        }
    }

    // 2. Handle reading_speed_wpm metric (special case - not from question tags)
    // reading_speed_wpm is now fully handled in Phase F which has access to passage data
    // We skip creating it here to avoid conflicts - Phase F will create the entry with speed_vs_accuracy_data
    // This comment is kept for context
    logger.info('   - Skipping reading_speed_wpm calculation (handled in Phase F)');

    // 3. Transform Aggregation into UserMetricProficiency objects
    const results: UserMetricProficiency[] = [];
    const now = new Date().toISOString();

    for (const [compositeKey, stats] of Array.from(aggregation.entries())) {
        const [dimension_type, dimension_key] = compositeKey.split("|");

        const accuracy = stats.correct / stats.total;

        // Calculate Confidence Score (Normalized to 0-1)
        // If confidence_level is 1-3, (avg / 3) gives 0-1 range
        const avgRawConfidence = stats.confidenceCount > 0
            ? stats.totalConfidence / stats.confidenceCount
            : 2; // Default to middle (2) if not provided
        const normalizedConfidence = avgRawConfidence / 3;

        results.push({
            id: uuidv4(),
            user_id: userId,
            dimension_type: dimension_type as any, // Cast to your Zod Enum
            dimension_key: dimension_key,
            proficiency_score: Math.round(accuracy * 100),
            confidence_score: Number(normalizedConfidence.toFixed(2)),
            total_attempts: stats.total,
            correct_attempts: stats.correct,
            last_session_id: sessionId,
            trend: null, // Trend requires historical comparison (Phase D)
            updated_at: now,
            created_at: now
        });
    }

    logger.info(`✅ [Phase B] Generated ${results.length} proficiency updates`);
    return results;
}
