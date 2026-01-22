// supabase/functions/customized-mocks/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// 1. Define standard CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("customized-mocks function loaded")

Deno.serve(async (req: Request) => {
  // 1. Handle Preflight (OPTIONS) requests explicitly
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const payload = await req.json()

    console.log("Customized-Mocks received payload:")
    console.log(payload)

    const userId = payload.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Prepare Environment Variables for bundled services
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    }

    // Inject env vars for 'process.env' compatibility in bundled code
    (globalThis as any).process = {
      env: {
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
        OPENAI_API_KEY: openAiKey,
      },
    };

    // 2. Import bundled customized-mocks service
    const { runCustomizedMock } = await import("./bundled.ts");

    // Pass the entire payload to runCustomizedMock as it contains all parameters
    const result = await runCustomizedMock(payload);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (err) {
    console.error("customized-mocks error:", err)

    return new Response(
      JSON.stringify({
        success: false,
        error: "Customized mock generation failed",
        details: err instanceof Error ? err.message : String(err)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
