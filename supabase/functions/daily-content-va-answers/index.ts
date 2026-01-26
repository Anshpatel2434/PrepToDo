// supabase/functions/daily-content-va-answers/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { handleStep6VAAnswers } from "./bundled.ts"

console.log("daily-content-va-answers function loaded")

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }),{ status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" }})
    }

    const payload = await req.json()
    console.log("📥 Received request for daily-content-va-answers")
    const result = await handleStep6VAAnswers(payload)

    return new Response(JSON.stringify({ success: true, data: result }),{ status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }})
  } catch (err) {
    console.error("❌ daily-content-va-answers error:", err)
    return new Response(JSON.stringify({ error: "Daily content VA answers selection failed", details: err instanceof Error ? err.message : String(err) }),{ status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }})
  }
})