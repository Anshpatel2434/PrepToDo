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

    // 2. Define the background task for heavy processing
    const generateMockExamInBackground = async () => {
      try {
        console.log("🚀 [BACKGROUND] Starting mock generation in background task");

        // Import bundled customized-mocks service
        const { runCustomizedMock } = await import("./bundled.ts");

        // Pass the entire payload to runCustomizedMock
        const result = await runCustomizedMock(payload);

        console.log("✅ [BACKGROUND] Mock generation completed successfully");
        console.log("Result:", result);
      } catch (err) {
        console.error("❌ [BACKGROUND] Mock generation failed:", err);
        console.error("Error details:", err instanceof Error ? err.message : String(err));
        console.error("Stack trace:", err instanceof Error ? err.stack : "N/A");

        // TODO: Update database to mark exam as "failed" status
        // This would require creating a placeholder exam record first
      }
    };

    // 3. Trigger background task using EdgeRuntime.waitUntil
    // This keeps the function alive after the response is sent
    console.log("⏳ [EDGE FUNCTION] Triggering background task");

    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(generateMockExamInBackground());
      console.log("✅ [EDGE FUNCTION] Background task triggered successfully");
    } else {
      // Fallback for local development or if EdgeRuntime is not available
      console.warn("⚠️ [EDGE FUNCTION] EdgeRuntime.waitUntil not available, running synchronously");
      await generateMockExamInBackground();
    }

    // 4. Return success immediately to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        message: "Mock generation started in background. Please refresh the page in 5-8 minutes to see your completed mock test.",
        status: "processing",
        user_id: userId,
        mock_name: payload.mock_name || "Customized Mock"
      }),
      {
        status: 202, // 202 Accepted - indicates async processing
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
