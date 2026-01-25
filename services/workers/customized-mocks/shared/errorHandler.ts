import { StateManager } from './stateManager';

export class ErrorHandler {
    /**
     * Handle error in a function step
     */
    static async handle(
        examId: string,
        step: string,
        error: unknown
    ): Promise<void> {
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);

        console.error(`❌ [ErrorHandler] Step ${step} failed for exam ${examId}`);
        console.error(`   Error: ${errorMessage}`);

        if (error instanceof Error && error.stack) {
            console.error(`   Stack trace:`, error.stack);
        }

        await StateManager.markFailed(examId, `Step ${step}: ${errorMessage}`);
    }

    /**
     * Wrap a function with error handling
     */
    static async withErrorHandling<T>(
        examId: string,
        step: string,
        fn: () => Promise<T>
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            await this.handle(examId, step, error);
            throw error;
        }
    }
}
