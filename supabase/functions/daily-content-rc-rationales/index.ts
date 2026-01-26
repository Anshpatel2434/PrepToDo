// supabase/functions/daily-content-rc-rationales/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { handleStep7RCRationales } from "./bundled.ts"

console.log("daily-content-rc-rationales function loaded")

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
    console.log("📥 Received request for daily-content-rc-rationales")
    const result = await handleStep7RCRationales(payload)

    return new Response(JSON.stringify({ success: true, data: result }),{ status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }})
  } catch (err) {
    console.error("❌ daily-content-rc-rationales error:", err)
    return new Response(JSON.stringify({ error: "Daily content RC rationales generation failed", details: err instanceof Error ? err.message : String(err) }),{ status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }})
  }
})