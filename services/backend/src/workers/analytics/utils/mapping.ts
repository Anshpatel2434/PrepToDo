// VARC Analytics - Metric Mapping Utilities

import type { MetricMapping } from "../types";

export function loadMetricMapping(json: any): MetricMapping {
    const metricToNodes = new Map<string, Set<string>>();
    const nodeToMetrics = new Map<string, Set<string>>();

    for (const [metricKey, metricData] of Object.entries(json.metrics)) {
        const nodesLabel = new Set<string>();

        for (const step of (metricData as any).reasoning_steps) {
            nodesLabel.add(step.label);

            if (!nodeToMetrics.has(step.label)) {
                nodeToMetrics.set(step.label, new Set<string>());
            }
            nodeToMetrics.get(step.label)!.add(metricKey);
        }

        metricToNodes.set(metricKey, nodesLabel);
    }

    return { metricToNodes, nodeToMetrics };
}
