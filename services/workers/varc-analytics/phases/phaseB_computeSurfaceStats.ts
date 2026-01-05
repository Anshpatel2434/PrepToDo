// VARC Analytics - Phase B: Compute Surface Statistics

import type { AttemptDatum, SurfaceStats, DimensionStats } from "../types";

export function phaseB_computeSurfaceStats(
  dataset: AttemptDatum[],
  nodeToMetrics: Map<string, Set<string>>
): SurfaceStats {

  console.log('📊 [Phase B] Computing surface statistics');

  const stats: SurfaceStats = {
    core_metric: new Map(),
    genre: new Map(),
    question_type: new Map(),
    reasoning_step: new Map(),
  };

  // Helper to update stats
  function updateStats(map: Map<string, DimensionStats>, key: string, attempt: AttemptDatum) {
    if (!map.has(key)) {
      map.set(key, { attempts: 0, correct: 0, accuracy: 0, avg_time: 0, score_0_100: 0 });
    }
    const s = map.get(key)!;
    s.attempts += 1;
    s.correct += attempt.correct ? 1 : 0;
    s.avg_time += attempt.time_spent_seconds;
  }

  // Process each attempt
  for (const attempt of dataset) {

    // 1. Core metrics (via reasoning node mapping)
    for (const nodeId of attempt.reasoning_node_ids) {
      const metricKeys = nodeToMetrics.get(nodeId);
      if (metricKeys) {
        for (const metricKey of metricKeys) {
          updateStats(stats.core_metric, metricKey, attempt);
        }
      }
    }

    // 2. Genre
    if (attempt.genre) {
      updateStats(stats.genre, attempt.genre, attempt);
    }

    // 3. Question type
    updateStats(stats.question_type, attempt.question_type, attempt);

    // 4. Reasoning step (direct node ID)
    for (const nodeId of attempt.reasoning_node_ids) {
      updateStats(stats.reasoning_step, nodeId, attempt);
    }
  }

  // Finalize averages and scores
  function finalizeStats(map: Map<string, DimensionStats>) {
    for (const [key, s] of map.entries()) {
      if (s.attempts > 0) {
        s.accuracy = s.correct / s.attempts;
        s.avg_time = s.avg_time / s.attempts;
        s.score_0_100 = Math.round(s.accuracy * 100);
      }
    }
  }

  finalizeStats(stats.core_metric);
  finalizeStats(stats.genre);
  finalizeStats(stats.question_type);
  finalizeStats(stats.reasoning_step);

  console.log(`✅ [Phase B] Computed stats for:`);
  console.log(`   - Core metrics: ${stats.core_metric.size}`);
  console.log(`   - Genres: ${stats.genre.size}`);
  console.log(`   - Question types: ${stats.question_type.size}`);
  console.log(`   - Reasoning steps: ${stats.reasoning_step.size}`);

  return stats;
}
