import type { UserMetricProficiency } from "../../../types";

export function transformRadarData(metrics: UserMetricProficiency[]) {
    return metrics.map((m) => ({
        skill: m.dimension_key,
        score: m.proficiency_score,
        confidence: m.confidence_score,
        trend: m.trend ?? "stagnant",
    }));
}

export function extractSpeedVsAccuracyData(metrics: UserMetricProficiency[]) {
    const readingSpeedMetric = metrics.find(
        (m) => m.dimension_type === "core_metric" && m.dimension_key === "reading_speed_wpm"
    );

    if (!readingSpeedMetric?.speed_vs_accuracy_data) {
        return [];
    }

    const data = readingSpeedMetric.speed_vs_accuracy_data;

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((d: { date: string; wpm?: number; accuracy?: number }) => ({
        date: d.date,
        wpm: d.wpm || 0,
        accuracy: d.accuracy || 0,
    }));
}

export function transformHeatmapData(genres: UserMetricProficiency[]) {
    return genres.map((g) => {
        const attempts = g.total_attempts || 0;
        const correct = g.correct_attempts || 0;
        const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;

        return {
            genre: g.dimension_key,
            score: g.proficiency_score,
            attempts,
            accuracy,
            trend: g.trend ?? "stagnant",
        };
    });
}


export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function scoreToHeatColor(score: number, isDark: boolean) {
    // 0 -> red, 50 -> yellow, 100 -> green
    const s = clamp(score, 0, 100) / 100;
    const hue = 0 + 120 * s; // red -> green
    const saturation = 80;
    const lightness = isDark ? 28 : 40;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function trendToColor(
    trend: "improving" | "declining" | "stagnant" | null | undefined,
    isDark: boolean
) {
    const t = trend ?? "stagnant";
    if (t === "improving") return isDark ? "#34d399" : "#16a34a";
    if (t === "declining") return isDark ? "#fb7185" : "#dc2626";
    return isDark ? "#a1a1aa" : "#71717a";
}
