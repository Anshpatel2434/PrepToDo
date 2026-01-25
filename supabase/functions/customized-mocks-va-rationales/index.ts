// supabase/functions/customized-mocks-va-rationales/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { exam_id } = await req.json();

        if (!exam_id) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing exam_id" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const openAiKey = Deno.env.get("OPENAI_API_KEY");

        (globalThis as any).process = {
            env: { SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, OPENAI_API_KEY: openAiKey },
        };

        const { handleStep7VaRationales } = await import("./bundled.ts");
        const result = await handleStep7VaRationales({ exam_id });

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("[VA Rationales] Error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
