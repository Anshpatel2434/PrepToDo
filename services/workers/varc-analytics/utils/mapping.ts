// VARC Analytics - Metric Mapping Utilities

import type { MetricMapping } from "../types";

export function loadMetricMapping(json: any): MetricMapping {
  const metricToNodes = new Map<string, Set<string>>();
  const nodeToMetrics = new Map<string, Set<string>>();

  for (const [metricKey, metricData] of Object.entries(json.metrics)) {
    const nodeIds = new Set<string>();

    for (const step of (metricData as any).reasoning_steps) {
      nodeIds.add(step.node_id);

      if (!nodeToMetrics.has(step.node_id)) {
        nodeToMetrics.set(step.node_id, new Set<string>());
      }
      nodeToMetrics.get(step.node_id)!.add(metricKey);
    }

    metricToNodes.set(metricKey, nodeIds);
  }

  return { metricToNodes, nodeToMetrics };
}
