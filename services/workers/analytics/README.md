# VARC Analytics System

## Overview

The VARC Analytics System is a comprehensive user performance tracking and streak management system designed to:
- Process practice session data for users
- Calculate proficiency metrics across multiple dimensions
- Perform LLM-based diagnostics on incorrect attempts
- Track daily streaks based on actual session completion
- Generate user analytics and proficiency signals

## Architecture

### Core Components

1. **runAnalytics.ts** - Main orchestrator that processes all unanalyzed sessions for a user
2. **Phase A** - Data collection and validation
3. **Phase B** - Quantitative aggregation of proficiency metrics  
4. **Phase C** - LLM diagnostics for incorrect attempts
5. **Phase D** - Proficiency engine updates
6. **Phase E** - Summary rollup to proficiency signals
7. **Phase F** - User analytics and streak calculation

### Key Changes (Latest Version)

#### 1. User-Centric Processing
- **Old**: Processed single session at a time
- **New**: Processes ALL unanalyzed sessions for a given user
- **Benefits**: Reduces redundant processing, ensures consistent state

#### 2. Accurate Streak Calculation
- **Streak Criteria**: User must have at least one completed session on a date to maintain streak
- **Fix**: Corrected bug where streak showed 1 even when no sessions existed for the day
- **Logic**: 
  - If user has session(s) today → streak continues/increases
  - If user has NO sessions today → streak breaks (current_streak = 0)
  - Longest streak is preserved historically

#### 3. Dual Trigger Scenarios
The system supports two trigger scenarios:

**A. Session Completion**
- Triggered when user completes a new practice session
- Processes all unanalyzed sessions for that user
- Updates analytics and streaks

**B. Day Change**
- Can be triggered daily (via cron/scheduler)
- Recalculates streaks without requiring new sessions
- Updates analytics to reflect current streak status

## API Reference

### Main Function

```typescript
export async function runAnalytics(params: {
    user_id: string;
}): Promise<AnalyticsResult>
```

**Parameters:**
- `user_id` - UUID of the user to process analytics for

**Returns:**
```typescript
{
    success: boolean;
    user_id: string;
    stats: {
        sessions_processed: number;
        total_attempts: number;
        correct_attempts: number;
        dimensions_updated: {
            core_metrics: number;
            genres: number;
            question_types: number;
        }
    }
}
```

## Deployment

### 1. Bundle for Supabase Edge Functions

```bash
cd /home/engine/project
node services/scripts/bundle-analytics-edge-function.js
```

This creates `/supabase/functions/user-analytics/bundled.ts`

### 2. Deploy Edge Function

```bash
cd /home/engine/project
supabase functions deploy user-analytics
```

### 3. Set Up Database Triggers

Execute the SQL in `/supabase/functions/user-analytics/setup-triggers.sql`

**Requirements:**
- pg_net extension enabled
- Configure Supabase URL and service role key:

```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-service-role-key';
SELECT pg_reload_conf();
```

### 4. Configure Environment Variables

Ensure these are set in your Supabase Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for Phase C diagnostics)

## Trigger Implementation

### Option A: Database Trigger (Recommended)

Automatically triggers analytics when a session is completed.

See `/supabase/functions/user-analytics/setup-triggers.sql` for full implementation.

### Option B: Application-Level Trigger

Call the edge function from your application:

```typescript
// After user completes session
await fetch(`${SUPABASE_URL}/functions/v1/user-analytics`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        user_id: userId,
        trigger_type: 'session_completed'
    })
});
```

### Option C: Scheduled Daily Streak Updates

Use pg_cron or external scheduler to trigger daily:

```sql
-- Example using pg_cron
SELECT cron.schedule(
    'daily-streak-update',
    '5 0 * * *',  -- Every day at 00:05 UTC
    $$
    -- Call analytics for all active users
    $$
);
```

See setup-triggers.sql for full implementation.

## Streak Calculation Logic

### Rules
1. **Active Day**: User must have at least ONE completed session on that date
2. **Current Streak**: 
   - Counts consecutive days with sessions, ending with today
   - If no session today, current streak = 0
3. **Longest Streak**: Historical maximum, never decreases

### Examples

**Example 1: Continuing Streak**
- Yesterday: Had session ✓
- Today: Had session ✓
- Result: current_streak increases by 1

**Example 2: Broken Streak**
- Yesterday: Had session ✓
- Today: NO session ✗
- Result: current_streak = 0 (streak broken)

**Example 3: Multiple Sessions Per Day**
- Today: 3 sessions completed
- Result: Counts as 1 active day (streak +1)

## Error Handling

The system includes comprehensive error handling:
- Try-catch blocks around all database operations
- Zod validation for data integrity
- Graceful degradation (continues processing other sessions on individual failures)
- Detailed logging at each phase

## Performance Considerations

1. **Batch Processing**: All unanalyzed sessions processed in single function call
2. **Idempotency**: Safe to call multiple times (checks is_analysed flag)
3. **Race Conditions**: Handled via database-level checks
4. **Transaction Safety**: Each session marked as analyzed only after successful processing

## Testing

### Local Testing

```bash
# Using services/index.ts
cd /home/engine/project/services
npm start
```

Update services/index.ts:
```typescript
await runAnalytics({ 
    user_id: "your-user-id-here" 
});
```

### Edge Function Testing

```bash
# Local Supabase
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/user-analytics' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"user_id":"user-uuid-here","trigger_type":"session_completed"}'
```

## Monitoring

### Check Processing Status

```sql
-- Check unanalyzed sessions
SELECT user_id, COUNT(*) as unanalyzed_count
FROM practice_sessions
WHERE is_analysed = false AND status = 'completed'
GROUP BY user_id;

-- Check recent analytics updates
SELECT user_id, date, current_streak, longest_streak, updated_at
FROM user_analytics
ORDER BY updated_at DESC
LIMIT 20;
```

### Check pg_net Queue

```sql
-- View recent HTTP requests (from triggers)
SELECT * FROM net._http_response 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Issue: Streak showing incorrect value

**Solution**: Ensure `hasSessionToday` logic correctly queries completed sessions for the date.

### Issue: Sessions not being processed

**Check**:
1. Trigger is installed and enabled
2. pg_net extension is enabled
3. Supabase URL and service key are configured
4. Edge function is deployed

### Issue: Analytics function times out

**Solutions**:
- Increase timeout in edge function settings
- Process sessions in smaller batches
- Optimize database queries

## Future Enhancements

- [ ] Parallel processing of multiple users
- [ ] Caching layer for frequently accessed data
- [ ] Real-time analytics updates via websockets
- [ ] Advanced streak features (freeze days, streak insurance)
- [ ] Comparative analytics (user vs peer group)

## Support

For issues or questions:
1. Check logs in Supabase Edge Functions dashboard
2. Review database trigger logs
3. Verify environment variables are set correctly
4. Ensure all required extensions are enabled
