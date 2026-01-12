// supabase/functions/user-analytics/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TriggerPayload =
    | { user_id: string; trigger_type?: "session_completed" | "day_change" | string }
    | {
          type?: string;
          table?: string;
          record?: { user_id?: string };
          old_record?: { user_id?: string };
      };

function extractUserId(payload: TriggerPayload): string | null {
    if (!payload || typeof payload !== "object") return null;

    if ("user_id" in payload && typeof payload.user_id === "string") {
        return payload.user_id;
    }

    if ("record" in payload && payload.record && typeof payload.record.user_id === "string") {
        return payload.record.user_id;
    }

    if (
        "old_record" in payload &&
        payload.old_record &&
        typeof payload.old_record.user_id === "string"
    ) {
        return payload.old_record.user_id;
    }

    return null;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const payload = (await req.json()) as TriggerPayload;
        const userId = extractUserId(payload);

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing user_id" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const openAiKey = Deno.env.get("OPENAI_API_KEY");

        if (!supabaseUrl || !serviceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        // The bundled services code reads env vars via `process.env`.
        (globalThis as any).process = {
            env: {
                SUPABASE_URL: supabaseUrl,
                SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
                OPENAI_API_KEY: openAiKey,
            },
        };

        const { runAnalytics } = await import("./bundled.ts");

        const result = await runAnalytics({ user_id: userId });

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("user-analytics error:", err);

        return new Response(
            JSON.stringify({
                success: false,
                error: "Analytics processing failed",
                details: err instanceof Error ? err.message : String(err),
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
