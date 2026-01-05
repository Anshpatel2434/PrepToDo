// supabase/functions/analyze-varc-session/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import from pre-bundled file
// Create this file by bundling your services folder
import { runVarcAnalytics } from "./bundled.ts"

console.log("analyze-varc-session function loaded")

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

    console.log("📥 Received request to run VARC analytics")
    console.log(`   Session ID: ${payload.session_id}`)
    console.log(`   User ID: ${payload.user_id}`)

    // Validate payload
    if (!payload.session_id || !payload.user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: session_id and user_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Run VARC analytics workflow
    const result = await runVarcAnalytics({
      session_id: payload.session_id,
      user_id: payload.user_id
    })

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
    console.error("❌ analyze-varc-session error:", err)

    return new Response(
      JSON.stringify({
        error: "VARC analytics failed",
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analyze-varc-session' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"session_id":"xxx","user_id":"yyy"}'
*/
