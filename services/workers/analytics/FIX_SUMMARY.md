# Fix Summary: Minutes Practiced Overcount Bug

## Problem
The user_analytics `minutes_practiced` field was showing higher values than the actual time spent in practice sessions.

## Root Causes Identified

### 1. Duplicate Records Issue (Primary Cause)
When multiple sessions were analyzed for the same day, the system could create duplicate analytics records instead of updating a single consolidated record. This happened when:
- The `user_id,date` unique constraint wasn't being respected or didn't exist
- Race conditions during concurrent session analysis
- The upsert logic was only reading the first record instead of aggregating all records

**Impact**: If the frontend sums all records for a day, it would show vastly inflated minutes.

### 2. WPM Calculation Bug (Secondary Issue)
The reading speed calculation was counting each passage's word count for EVERY question attempt instead of counting it once.

**Example**: 
- Passage with 500 words
- 5 questions from that passage
- Old behavior: 500 × 5 = 2,500 words counted
- Correct behavior: 500 words counted (user reads the passage once)

While this didn't directly affect `minutes_practiced`, it caused inflated WPM metrics which may have been what the user was observing.

## Changes Made

### File: `services/workers/analytics/phases/phaseF_updateUserAnalytics.ts`

#### Change 1: Aggregate All Existing Records (Lines 95-107)
**Before**: Only took the first analytics record from `existingAnalyticsList`
```typescript
const existingAnalytics = existingAnalyticsList?.[0] || null;
```

**After**: Aggregate ALL records by summing numeric fields
```typescript
const existingAnalytics = existingAnalyticsList?.length > 0 ? {
    minutes_practiced: existingAnalyticsList.reduce((sum, r) => sum + (r.minutes_practiced || 0), 0),
    questions_attempted: existingAnalyticsList.reduce((sum, r) => sum + (r.questions_attempted || 0), 0),
    questions_correct: existingAnalyticsList.reduce((sum, r) => sum + (r.questions_correct || 0), 0),
    accuracy_percentage: existingAnalyticsList[0]?.accuracy_percentage || 0,
    points_earned_today: existingAnalyticsList.reduce((sum, r) => sum + (r.points_earned_today || 0), 0),
    // ... other fields use most recent
} : null;
```

#### Change 2: Delete Duplicates Before Insert (Lines 158-183)
**Before**: Used upsert with `onConflict: 'user_id,date'`
```typescript
const { error: upsertError } = await supabase
    .from('user_analytics')
    .upsert(upsertData, {
        onConflict: 'user_id,date',
    });
```

**After**: Explicitly delete all existing records, then insert a new consolidated one
```typescript
// Delete all existing analytics records for this user/day
if (existingAnalyticsList && existingAnalyticsList.length > 0) {
    const { error: deleteError } = await supabase
        .from('user_analytics')
        .delete()
        .eq('user_id', user_id)
        .eq('date', today);
    // ... error handling
}

// Insert new consolidated analytics record
const { error: upsertError } = await supabase
    .from('user_analytics')
    .insert(upsertData);
```

#### Change 3: Fix WPM Calculation (Lines 346-352)
**Before**: Counted passage words for each attempt
```typescript
for (const attempt of dataset) {
    if (attempt.passage_id && passageWordCount.has(attempt.passage_id)) {
        totalWords += passageWordCount.get(attempt.passage_id) || 0;
    }
    totalTimeSeconds += attempt.time_spent_seconds;
}
```

**After**: Count each passage only once
```typescript
// Calculate total words (each passage counted once)
let totalWords = 0;
for (const passageId of passageIds) {
    if (passageWordCount.has(passageId)) {
        totalWords += passageWordCount.get(passageId) || 0;
    }
}

// Calculate total time spent (sum of all question attempt times)
let totalTimeSeconds = 0;
for (const attempt of dataset) {
    totalTimeSeconds += attempt.time_spent_seconds;
}
```

## Testing Recommendations
1. Analyze multiple sessions for the same day and verify only one analytics record exists
2. Check that `minutes_practiced` matches the sum of all session times for that day
3. Verify WPM calculation is reasonable (typically 100-400 words per minute)
4. Test concurrent session analysis to ensure no race conditions

## Impact
- ✅ Prevents duplicate analytics records from accumulating
- ✅ Ensures accurate `minutes_practiced` totals
- ✅ Fixes inflated WPM calculations
- ✅ More defensive programming to handle edge cases
