import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service";

export const triggerAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId; // Assuming auth middleware populates user
        const { targetUserId } = req.body; // Allow admin to trigger for others if needed

        const effectiveUserId = targetUserId || userId;

        if (!effectiveUserId) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        const result = await analyticsService.triggerAnalytics(effectiveUserId);

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
