import { runAnalytics } from "../../workers/analytics/runAnalytics";

export class AnalyticsService {
    async triggerAnalytics(userId: string) {
        return await runAnalytics({ user_id: userId });
    }
}

export const analyticsService = new AnalyticsService();