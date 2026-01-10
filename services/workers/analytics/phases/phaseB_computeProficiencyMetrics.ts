import {
    AttemptDatum,
    UserMetricProficiency,
    MetricMapping
} from "../types";
import { v4 as uuidv4 } from 'uuid';

export function phaseB_computeProficiencyMetrics(
    userId: string,
    sessionId: string,
    dataset: AttemptDatum[],
    mapping: MetricMapping
): UserMetricProficiency[] {

    console.log('📊 [Phase B] Computing User Metric Proficiency');

    // Temporary storage for aggregation
    // Key: "dimension_type|dimension_key"
    const aggregation = new Map<string, {
        correct: number;
        total: number;
        totalConfidence: number;
        confidenceCount: number;
    }>();

    // Helper to update the aggregation map
    const update = (type: string, key: string, isCorrect: boolean, confidence: number | null) => {
        const compositeKey = `${type}|${key}`;
        if (!aggregation.has(compositeKey)) {
            aggregation.set(compositeKey, { correct: 0, total: 0, totalConfidence: 0, confidenceCount: 0 });
        }

        const stats = aggregation.get(compositeKey)!;
        stats.total += 1;
        stats.correct += isCorrect ? 1 : 0;

        if (confidence !== null) {
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
    // reading_speed_wpm is calculated from passage word count and time spent
    // We add it as a core_metric with the calculated WPM score (0-100 normalized)
    const readingSpeedWpm = calculateReadingSpeedWpm(dataset);
    if (readingSpeedWpm > 0) {
        // Normalize WPM to 0-100 scale for proficiency score
        // Typical reading speeds: 50-400 WPM
        // We cap at 50 (0%) and 400 (100%)
        const normalizedWpm = Math.min(100, Math.max(0, Math.round(((readingSpeedWpm - 50) / 350) * 100)));
        
        // Add reading_speed_wpm as a special metric entry
        // For this metric, we use the session's overall performance as the "correct" indicator
        // This is a proxy - in practice, reading speed doesn't have "correct/incorrect"
        // but we store it in the same schema for consistency
        const correctPercentage = dataset.filter(d => d.correct).length / dataset.length;
        
        // Set the aggregation for reading_speed_wpm
        aggregation.set("core_metric|reading_speed_wpm", {
            correct: Math.round(correctPercentage * 100), // Store accuracy proxy as "correct" count
            total: 100, // Normalize to 100 for percentage
            totalConfidence: 0,
            confidenceCount: 0,
        });
        
        console.log(`   - Reading speed: ${readingSpeedWpm} WPM (normalized: ${normalizedWpm}%)`);
    }

    // 3. Transform Aggregation into UserMetricProficiency objects
    const results: UserMetricProficiency[] = [];
    const now = new Date().toISOString();

    for (const [compositeKey, stats] of Array.from(aggregation.entries())) {
        const [dimension_type, dimension_key] = compositeKey.split("|");

        let accuracy: number;
        let normalizedConfidence: number;

        if (dimension_key === 'reading_speed_wpm') {
            // Special handling for reading_speed_wpm
            // Use the stored "correct" value as the proficiency score directly
            accuracy = stats.correct / 100; // Already normalized
            normalizedConfidence = 0.8; // High confidence for calculated metrics
        } else {
            accuracy = stats.correct / stats.total;
            
            // Calculate Confidence Score (Normalized to 0-1)
            // If confidence_level is 1-3, (avg / 3) gives 0-1 range
            const avgRawConfidence = stats.confidenceCount > 0
                ? stats.totalConfidence / stats.confidenceCount
                : 2; // Default to middle (2) if not provided
            normalizedConfidence = avgRawConfidence / 3;
        }

        results.push({
            id: uuidv4(),
            user_id: userId,
            dimension_type: dimension_type as any, // Cast to your Zod Enum
            dimension_key: dimension_key,
            proficiency_score: dimension_key === 'reading_speed_wpm' 
                ? stats.correct // Use the stored value directly for reading_speed_wpm
                : Math.round(accuracy * 100),
            confidence_score: Number(normalizedConfidence.toFixed(2)),
            total_attempts: dimension_key === 'reading_speed_wpm' ? dataset.length : stats.total,
            correct_attempts: dimension_key === 'reading_speed_wpm' ? stats.correct : stats.correct,
            last_session_id: sessionId,
            trend: null, // Trend requires historical comparison (Phase D)
            updated_at: now,
            created_at: now
        });
    }

    console.log(`✅ [Phase B] Generated ${results.length} proficiency updates`);
    return results;
}

/**
 * Calculate reading speed in words per minute from dataset
 * This is used in Phase B to populate the reading_speed_wpm metric
 */
export function calculateReadingSpeedWpm(dataset: AttemptDatum[]): number {
    if (dataset.length === 0) return 0;

    // Collect passage IDs and their word counts
    // We need to get word_count from passage data which is not in AttemptDatum
    // This function returns 0 if passage data is not available
    // The actual calculation will happen in Phase F with full passage access
    
    // For Phase B, we return 0 since we don't have passage word counts here
    // Phase F will calculate the actual WPM and update user_analytics
    // But we still need to add the metric entry for user_metric_proficiency
    
    return 0;
}