import { supabase } from '../../../config/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js'

export class FunctionInvoker {
    private static readonly FUNCTION_MAP = {
        'step-2': 'customized-mocks-passages',
        'step-3': 'customized-mocks-rc-questions',
        'step-4': 'customized-mocks-va-questions',
        'step-5': 'customized-mocks-select-answers',
        'step-6': 'customized-mocks-rc-rationales',
        'step-7': 'customized-mocks-va-rationales',
    };

    static async invokeNext(
        step: keyof typeof FunctionInvoker.FUNCTION_MAP,
        payload: { exam_id: string }
    ): Promise<void> {
        const functionName = this.FUNCTION_MAP[step];

        if (!functionName) {
            throw new Error(`Unknown step: ${step}`);
        }

        console.log(`📞 [FunctionInvoker] Invoking ${functionName}`);

        try {
            const { data, error } = await supabase.functions.invoke(functionName, {
                body: payload,
                headers: {
                    Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,

                    // Sometimes required to ensure the runtime doesn't try 
                    // to use a stale session from the client state
                    "X-Client-Info": "supabase-js-admin"
                }
            });

            if (error) {
                if (error instanceof FunctionsHttpError) {
                    const errorContext = await error.context.json();
                    console.error(`❌ [${functionName}] Auth Error:`, errorContext);
                } else {
                    console.error(`❌ [${functionName}] Error:`, error.message);
                }
            } else {
                console.log(`✅ Successfully invoked ${functionName}`);
            }

            console.log(`🚀 [FunctionInvoker] Triggered ${functionName}, not waiting for response`);
        } catch (err) {
            // This catches immediate synchronous errors in setting up the call
            console.error(`❌ [FunctionInvoker] Immediate failure:`, err);
            throw err;
        }
    }
}