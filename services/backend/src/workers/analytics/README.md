# VARC Analytics System (Backend Architecture)

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
2. **Phase A** - Data collection and validation (with Zod schema validation)
3. **Phase B** - Quantitative aggregation of proficiency metrics
4. **Phase C** - LLM diagnostics for incorrect attempts
5. **Phase D** - Proficiency engine updates
6. **Phase E** - Summary rollup to proficiency signals
7. **Phase F** - User analytics and streak calculation

### Key Changes (Backend Version)

#### 1. Database Layer

- **Old**: Supabase client with direct SQL queries
- **New**: Drizzle ORM with type-safe queries
- **Benefits**: Type safety, better developer experience, consistent data access

#### 2. Data Validation

- **Maintained**: Full Zod validation for all database queries
- **Ensures**: Data integrity and type safety throughout the pipeline
- **Validates**: Sessions, attempts, questions, and passages

#### 3. User-Centric Processing

- **Old**: Processed single session at a time
- **New**: Processes ALL unanalyzed sessions for a given user
- **Benefits**: Reduces redundant processing, ensures consistent state

#### 4. Accurate Streak Calculation

- **Streak Criteria**: User must have at least 5 minutes (300 seconds) of completed practice time on a date to maintain streak
- **Fix**: Corrected bug where streak showed 1 even when no sessions existed for the day, and now enforces minimum practice time
- **Logic**:
  - If user has >= 5 minutes of practice today → streak continues/increases
  - If user has < 5 minutes of practice today → streak breaks (current_streak = 0)
  - Multiple sessions on same day are aggregated (e.g., 3min + 3min = 6min qualifies)
  - Longest streak is preserved historically

#### 5. Dual Trigger Scenarios

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
}): Promise<AnalyticsResult>;
```

**Parameters:**

- `user_id` - UUID of the user to process analytics for

**Returns:**

```typescript
{
	success: boolean;
	user_id: string;
	stats: {
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

### 1. Database Setup

Ensure your PostgreSQL database has all required tables:

- `practice_sessions`
- `question_attempts`
- `questions`
- `passages`
- `user_metric_proficiency`
- `user_proficiency_signals`
- `user_analytics`

### 2. Environment Variables

Configure these in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your-openai-api-key
```

### 3. Run Analytics

```typescript
import { runAnalytics } from "./workers/analytics/runAnalytics";

// Process analytics for a user
await runAnalytics({
	user_id: "user-uuid-here",
});
```

### 4. Trigger Implementation

#### Option A: Application-Level Trigger (Recommended)

Call the analytics function after session completion:

```typescript
// After user completes session
await runAnalytics({
	user_id: userId,
});
```

#### Option B: Scheduled Daily Streak Updates

Use a cron job or scheduler to trigger daily:

```typescript
// Every day at 00:05 UTC
cron.schedule("5 0 * * *", async () => {
	// Get all active users
	const activeUsers = await getActiveUsers();

	for (const user of activeUsers) {
		await runAnalytics({ user_id: user.id });
	}
});
```

## Streak Calculation Logic

### Rules

1. **Active Day**: User must have at least 5 MINUTES (300 seconds) of completed practice time on that date
2. **Current Streak**:
   - Counts consecutive days with >= 5 minutes of practice, ending with today
   - If no qualifying session today (< 5 minutes total), current streak = 0
3. **Longest Streak**: Historical maximum, never decreases

### Examples

**Example 1: Continuing Streak**

- Yesterday: Had 10 minutes of practice ✓
- Today: Had 8 minutes of practice ✓
- Result: current_streak increases by 1

**Example 2: Broken Streak (Insufficient Time)**

- Yesterday: Had 10 minutes of practice ✓
- Today: Had only 3 minutes of practice ✗
- Result: current_streak = 0 (streak broken - didn't meet 5-minute minimum)

**Example 3: Broken Streak (No Session)**

- Yesterday: Had 10 minutes of practice ✓
- Today: NO session ✗
- Result: current_streak = 0 (streak broken)

**Example 4: Multiple Sessions Per Day**

- Today: 3 sessions (2 min + 2 min + 3 min = 7 minutes total)
- Result: Counts as 1 active day (streak +1) because total >= 5 minutes

**Example 5: Multiple Sessions But Insufficient**

- Today: 2 sessions (2 min + 2 min = 4 minutes total)
- Result: Does NOT count as active day (streak breaks) because total < 5 minutes

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
# Using your backend service
cd services/backend
npm run dev

# Or run directly
ts-node src/workers/analytics/runAnalytics.ts
```

Update your test file:

```typescript
import { runAnalytics } from "./workers/analytics/runAnalytics";

await runAnalytics({
	user_id: "your-user-id-here",
});
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
SELECT user_id, last_active_date, current_streak, longest_streak, updated_at
FROM user_analytics
ORDER BY updated_at DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Streak showing incorrect value

**Solution**: Ensure `hasSessionToday` logic correctly queries completed sessions for the date.

### Issue: Sessions not being processed

**Check**:

1. Session status is 'completed'
2. is_analysed flag is false
3. Database connection is working
4. Environment variables are set correctly

### Issue: Analytics function times out

**Solutions**:

- Process sessions in smaller batches
- Optimize database queries
- Check database indexes

### Issue: Validation errors

**Check**:

1. Database schema matches Zod schemas in types.ts
2. All required fields are present
3. Data types are correct (especially JSON fields)

## Differences from Supabase Version

1. **Database Layer**: Drizzle ORM instead of Supabase client
2. **Type Safety**: Full TypeScript types from Drizzle schema
3. **Validation**: Maintained Zod validation for all queries
4. **Deployment**: Runs in your backend service instead of edge functions
5. **Configuration**: Uses environment variables instead of Supabase secrets

## Future Enhancements

- [ ] Parallel processing of multiple users
- [ ] Caching layer for frequently accessed data
- [ ] Real-time analytics updates via websockets
- [ ] Advanced streak features (freeze days, streak insurance)
- [ ] Comparative analytics (user vs peer group)

## Support

For issues or questions:

1. Check logs in your backend service
2. Verify database schema matches expectations
3. Ensure all environment variables are set correctly
4. Check Zod validation errors for data issues
