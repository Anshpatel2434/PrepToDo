// =============================================================================
// Daily Content Worker - Cost Tracker
// =============================================================================
// Cost tracking utility for monitoring AI API usage and costs

import { createChildLogger } from "../../../../common/utils/logger.js";

interface APICall {
    functionName: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: string;
}

export class CostTracker {
    private logger = createChildLogger('cost-tracker');
    private calls: APICall[] = [];

    // OpenAI gpt-4o-mini pricing (per 1M tokens)
    private readonly INPUT_COST_PER_MILLION = 0.150;
    private readonly OUTPUT_COST_PER_MILLION = 0.600;

    /**
     * Log an API call with token usage
     */
    logCall(functionName: string, inputTokens: number, outputTokens: number): void {
        const call: APICall = {
            functionName,
            inputTokens,
            outputTokens,
            timestamp: new Date().toISOString(),
        };

        this.calls.push(call);

        const callCost = this.calculateCallCost(inputTokens, outputTokens);
        this.logger.info(`💰[Cost] ${functionName}: ${inputTokens} in, ${outputTokens} out(~$${callCost.toFixed(4)})`);

        // Alert on high token usage
        if (inputTokens > 10000) {
            this.logger.warn(`⚠️[Cost] High input token usage in ${functionName}: ${inputTokens} tokens`);
        }
    }

    /**
     * Calculate cost for a single call
     */
    private calculateCallCost(inputTokens: number, outputTokens: number): number {
        const inputCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_MILLION;
        const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;
        return inputCost + outputCost;
    }

    /**
     * Get summary report of all tracked calls
     */
    getReport(): {
        totalInputTokens: number;
        totalOutputTokens: number;
        totalCost: number;
        callCount: number;
        breakdown: Array<{
            function: string;
            inputTokens: number;
            outputTokens: number;
            cost: number;
            percentage: number;
        }>;
    } {
        const totalInputTokens = this.calls.reduce((sum, call) => sum + call.inputTokens, 0);
        const totalOutputTokens = this.calls.reduce((sum, call) => sum + call.outputTokens, 0);
        const totalCost = this.calculateCallCost(totalInputTokens, totalOutputTokens);

        // Aggregate by function name
        const functionMap = new Map<string, { input: number; output: number }>();

        for (const call of this.calls) {
            const existing = functionMap.get(call.functionName) || { input: 0, output: 0 };
            functionMap.set(call.functionName, {
                input: existing.input + call.inputTokens,
                output: existing.output + call.outputTokens,
            });
        }

        const breakdown = Array.from(functionMap.entries()).map(([functionName, tokens]) => {
            const cost = this.calculateCallCost(tokens.input, tokens.output);
            const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;

            return {
                function: functionName,
                inputTokens: tokens.input,
                outputTokens: tokens.output,
                cost,
                percentage,
            };
        }).sort((a, b) => b.cost - a.cost); // Sort by cost descending

        return {
            totalInputTokens,
            totalOutputTokens,
            totalCost,
            callCount: this.calls.length,
            breakdown,
        };
    }

    /**
     * Print formatted cost report to console
     */
    printReport(): void {
        const report = this.getReport();

        this.logger.info("\n" + "=".repeat(70));
        this.logger.info("💰 COST TRACKER REPORT");
        this.logger.info("=".repeat(70));
        this.logger.info(`Total API Calls: ${report.callCount} `);
        this.logger.info(`Total Input Tokens: ${report.totalInputTokens.toLocaleString()} `);
        this.logger.info(`Total Output Tokens: ${report.totalOutputTokens.toLocaleString()} `);
        this.logger.info(`Estimated Cost: $${report.totalCost.toFixed(4)} `);
        this.logger.info("\nBreakdown by Function:");
        this.logger.info("-".repeat(70));

        for (const item of report.breakdown) {
            this.logger.info(
                `${item.function.padEnd(35)} | ` +
                `In: ${String(item.inputTokens).padStart(6)} | ` +
                `Out: ${String(item.outputTokens).padStart(5)} | ` +
                `$${item.cost.toFixed(4)} (${item.percentage.toFixed(1)}%)`
            );
        }

        this.logger.info("=".repeat(70) + "\n");
    }
}
