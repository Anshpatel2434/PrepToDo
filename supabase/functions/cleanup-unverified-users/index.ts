import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cleanup unverified users older than 30 minutes
const CLEANUP_THRESHOLD_MINUTES = 30;

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing required environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Calculate threshold time (30 minutes ago)
        const thresholdTime = new Date();
        thresholdTime.setMinutes(thresholdTime.getMinutes() - CLEANUP_THRESHOLD_MINUTES);

        // List all auth users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
        }

        let deletedCount = 0;
        const errors: string[] = [];

        for (const user of users || []) {
            // Check if user is waiting for verification (email_confirmed_at is null)
            // AND was created more than 30 minutes ago
            const isUnverified = !user.email_confirmed_at;
            const createdAt = new Date(user.created_at);
            const isOlderThanThreshold = createdAt < thresholdTime;

            if (isUnverified && isOlderThanThreshold) {
                try {
                    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

                    if (deleteError) {
                        errors.push(`${user.email}: ${deleteError.message}`);
                    } else {
                        deletedCount++;
                        console.log(`Deleted unverified user: ${user.email}, created: ${user.created_at}`);
                    }
                } catch (err) {
                    errors.push(`${user.email}: ${err}`);
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                deletedCount,
                totalUsersChecked: users?.length || 0,
                thresholdTime: thresholdTime.toISOString(),
                errors: errors.length > 0 ? errors : undefined,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('cleanup-unverified-users error:', err);
        return new Response(
            JSON.stringify({
                error: 'Cleanup failed',
                details: err instanceof Error ? err.message : String(err)
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
