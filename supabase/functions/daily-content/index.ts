// supabase/functions/daily-content/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import from the pre-bundled file
// Create this file by bundling your services folder
import { runDailyContent } from "./bundled.ts"

console.log("daily-content function loaded")

// 1. Define standard CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any domain (change to your specific domain for production)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    console.log("📥 Received request to run daily content generation")

    // Run the daily content workflow
    const result = await runDailyContent()

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (err) {
    console.error("❌ daily-content error:", err)

    return new Response(
      JSON.stringify({
        error: "Daily content generation failed",
        details: err instanceof Error ? err.message : String(err)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/daily-content' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{}'
*/
