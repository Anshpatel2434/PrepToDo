// supabase/functions/customized-mocks-init/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("customized-mocks-init function loaded");

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method Not Allowed" }),
                { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const payload = await req.json();
        console.log("[Init] Received payload:", payload);

        // Validate required fields
        if (!payload.user_id) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing user_id" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Prepare environment variables
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const openAiKey = Deno.env.get("OPENAI_API_KEY");

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }

        // Inject env vars for bundled code
        (globalThis as any).process = {
            env: {
                SUPABASE_URL: supabaseUrl,
                SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
                OPENAI_API_KEY: openAiKey,
            },
        };

        // Import and run handler
        const { handleStep1Init } = await import("./bundled.ts");
        const result = await handleStep1Init(payload);

        // Return 202 Accepted (async processing started)
        return new Response(
            JSON.stringify({
                ...result,
                message: "Mock generation started. Please refresh the page in 5-8 minutes to see your completed mock test."
            }),
            { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[Init] Error:", err);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Initialization failed",
                details: err instanceof Error ? err.message : String(err)
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
