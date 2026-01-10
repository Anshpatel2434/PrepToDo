import type { UserAnalytics, UserMetricProficiency } from "../../../types";

export function transformRadarData(metrics: UserMetricProficiency[]) {
    return metrics.map((m) => ({
        skill: m.dimension_key,
        score: m.proficiency_score,
        confidence: m.confidence_score,
        trend: m.trend ?? "stagnant",
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

export function calculateWPMAccuracyData(analytics: UserAnalytics[]) {
    const AVG_WORDS_PER_QUESTION = 300;

    return analytics.map((a) => ({
        date: a.date,
        wpm:
            a.minutes_practiced > 0
                ? (a.questions_attempted * AVG_WORDS_PER_QUESTION) /
                  a.minutes_practiced
                : 0,
        accuracy: a.accuracy_percentage ?? 0,
    }));
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
