# Customized Mocks - Chained Edge Functions

## Overview

This module implements customized mock test generation using **7 chained edge functions**, each staying under the 150-second Supabase Edge Function limit.

## Architecture

```
Frontend → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Complete
           Init     Passages  RC Qs    VA Qs    Answers  RC Rats  VA Rats
           (~60s)   (~60s)    (~120s)  (~90s)   (~60s)   (~120s)  (~90s)
```

**Total Time:** ~10 minutes (including cold starts)

## Folder Structure

```
customized-mocks/
├── setup-triggers.sql          # Database migration
├── types/                      # TypeScript types
│   ├── state.ts               # Generation state types
│   └── index.ts               # Type exports
├── shared/                     # Shared utilities
│   ├── supabase.ts            # Supabase client
│   ├── stateManager.ts        # State management
│   ├── functionInvoker.ts     # Function chaining
│   └── errorHandler.ts        # Error handling
├── core/                       # Business logic
│   ├── articles/              # Article fetching
│   ├── passages/              # Passage generation
│   ├── questions/             # Question generation
│   │   ├── rc/               # RC questions
│   │   └── va/               # VA questions
│   └── reasoning/             # Reasoning graph
└── functions/                  # Function handlers
    ├── step1Init/             # Initialize & fetch articles
    ├── step2Passages/         # Generate passages
    ├── step3RcQuestions/      # Generate RC questions
    ├── step4VaQuestions/      # Generate VA questions
    ├── step5SelectAnswers/    # Select all answers
    ├── step6RcRationales/     # Generate RC rationales
    └── step7VaRationales/     # Generate VA rationales & finalize
```

## Setup

### 1. Run Database Migration

```bash
psql -h <your-db-host> -U postgres -d postgres -f setup-triggers.sql
```

Or via Supabase Dashboard → SQL Editor → paste contents of `setup-triggers.sql`

### 2. Bundle Edge Functions

```bash
cd services
npm run bundle:customized-mocks
```

This will bundle all 7 functions to `supabase/functions/customized-mocks-*`

### 3. Deploy Edge Functions

```bash
supabase functions deploy customized-mocks-init
supabase functions deploy customized-mocks-passages
supabase functions deploy customized-mocks-rc-questions
supabase functions deploy customized-mocks-va-questions
supabase functions deploy customized-mocks-select-answers
supabase functions deploy customized-mocks-rc-rationales
supabase functions deploy customized-mocks-va-rationales
```

## Usage

### Frontend

Call the init function:

```typescript
const result = await supabase.functions.invoke('customized-mocks-init', {
    body: {
        user_id: userId,
        mock_name: "My Custom Mock",
        target_genres: ["Philosophy", "History", "Economics"],
        num_passages: 3,
        total_questions: 20,
        // ... other params
    }
});

// Returns immediately with 202 Accepted
// { success: true, exam_id: "...", status: "initializing" }
```

### Monitoring Progress (Optional)

Subscribe to state changes:

```typescript
const subscription = supabase
    .channel('exam-generation')
    .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'exam_generation_state',
        filter: `exam_id=eq.${examId}`
    }, (payload) => {
        const { status, current_step, total_steps } = payload.new;
        console.log(`Step ${current_step}/${total_steps}: ${status}`);
    })
    .subscribe();
```

## Function Chain

| Step | Function | Time | Description |
|------|----------|------|-------------|
| 1 | customized-mocks-init | ~60s | Create exam, fetch articles |
| 2 | customized-mocks-passages | ~60s | Generate CAT passages |
| 3 | customized-mocks-rc-questions | ~120s | Generate RC questions |
| 4 | customized-mocks-va-questions | ~90s | Generate VA questions |
| 5 | customized-mocks-select-answers | ~60s | Select correct answers |
| 6 | customized-mocks-rc-rationales | ~120s | Generate RC rationales |
| 7 | customized-mocks-va-rationales | ~90s | Generate VA rationales |

## Error Handling

If any step fails:
- Error is logged to `exam_generation_state.error_message`
- Exam status is marked as `failed`
- Chain stops (next function is not invoked)

## Development

### Adding a New Step

1. Create handler in `functions/stepXName/handler.ts`
2. Update `bundleCustomizedMocks.js` with new entry
3. Create edge function wrapper in `supabase/functions/`
4. Update `FunctionInvoker.FUNCTION_MAP`
5. Bundle and deploy

### Testing Individual Steps

Each step can be tested independently by providing an `exam_id`:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/customized-mocks-passages \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"exam_id": "your-exam-id"}'
```

## Troubleshooting

### Function Timeout

- Check Supabase logs for the specific function
- Verify each step is under 150 seconds
- Consider breaking down further if needed

### Chain Breaks

- Check `exam_generation_state` table for error messages
- Verify all functions are deployed
- Check function invocation permissions

### State Not Found

- Ensure database migration was run
- Check exam_id exists in `exam_papers`
- Verify `exam_generation_state` record was created
