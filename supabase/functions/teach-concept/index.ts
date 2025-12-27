// supabase/functions/teach-concept/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Option 1: Import from a pre-bundled file
// Create this file by bundling your services folder
import { runConceptTeaching } from "./bundled.ts"

console.log("teach-concept function loaded")

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

    console.log("This is the payload recieved by the backend")
    console.log(payload)
    
    if (!payload || typeof payload !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const result = await runConceptTeaching(payload.conceptQuery)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )

  } catch (err) {
    console.error("teach-concept error:", err)

    return new Response(
      JSON.stringify({ 
        error: "Concept teaching failed",
        details: err instanceof Error ? err.message : String(err)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})