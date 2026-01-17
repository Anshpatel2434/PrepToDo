# Customized Mocks Worker

## Overview

The Customized Mocks Worker generates personalized CAT VARC mock tests based on user analytics and preferences. It follows the same architecture as the daily-content worker but supports:

- Multiple passages per mock
- Personalized content based on user analytics
- Smart article usage checking (avoids daily & previously used articles)
- Configurable question distribution
- Time limits and difficulty targeting
- Target metrics and weak area addressing

## Architecture

### Folder Structure

```
customized-mocks/
├── graph/                                    # Reasoning graph operations
│   ├── createReasoningGraphContext.ts          # Build graph context for rationales
│   └── fetchNodes.ts                         # Fetch graph nodes from DB
├── retrieval/                                 # Data fetching and generation
│   ├── articleHandling/                         # Article fetching and validation
│   │   ├── fetchArticleText.ts                 # Fetch article content
│   │   ├── fetchExistingArticleUrls.ts          # Get existing URLs for deduplication
│   │   ├── getValidArticlesForCustomMock.ts    # Main article fetcher with smart checking
│   │   ├── saveArticle.ts                    # Save article to DB
│   │   └── searchWebForArticles.ts            # Web search for articles
│   ├── passageHandling/                         # Passage generation
│   │   ├── evaluateCATLikeness.ts              # Evaluate CAT-likeness
│   │   ├── extractSemanticIdeas.ts            # Extract semantic ideas from articles
│   │   ├── fetchPassagesData.ts               # Fetch passages by IDs
│   │   ├── finalizeCATPassage.ts              # Add metadata to passages
│   │   ├── generatePassage.ts                 # Generate CAT-style passages
│   │   └── sharpenToCATStyle.ts               # Sharpen passages (placeholder)
│   ├── rcQuestionsHandling/                    # RC question generation
│   │   ├── generateRCQuestions.ts             # Generate RC questions with personalization
│   │   ├── generateRationaleWithEdges.ts       # Generate elimination-driven rationales
│   │   ├── selectCorrectAnswers.ts             # Select correct answers
│   │   └── tagQuestionsWithNodes.ts          # Tag with reasoning metrics
│   ├── vaQuestionsHandling/                    # VA question generation
│   │   ├── generateVAQuestions.ts             # Generate all VA types
│   │   ├── generateVARationales.ts            # Generate VA rationales
│   │   ├── selectVAAnswers.ts                # Select VA answers
│   │   └── tagVAQuestionsWithNodes.ts        # Tag VA questions
│   ├── fetchGenre.ts                          # Fetch/create genre
│   ├── fetchPassagesData.ts                   # Fetch passages (duplicate, remove)
│   ├── fetchQuestionsData.ts                  # Fetch questions by IDs
│   ├── formatOutputForDB.ts                   # Format data for DB upload
│   ├── generateEmbedding.ts                   # Generate embeddings for search
│   ├── saveAllDataToDB.ts                   # Save all data to Supabase
│   └── searchPassageAndQuestionEmbeddings.ts   # Vector search for PYQ references
├── schemas/                                   # Type definitions
│   └── types.ts                              # All Zod schemas and types
└── runCustomizedMock.ts                       # Main orchestrator
```

## Key Differences from Daily Content Worker

### 1. Multiple Passages
- Daily: Generates 1 passage per day
- Custom: Supports 1-5 passages per mock

### 2. Smart Article Usage Checking
Daily content worker:
- Checks `used_in_daily` flag only

Custom mock worker:
- Checks `used_in_daily` flag (skip if true)
- Checks `used_in_custom_exam` flag
- If used in custom exam, verifies if used by **THIS specific user**
- Only fetches new articles if no valid existing articles found

### 3. Personalization
Daily content worker:
- Fixed question distribution (4 RC + 3 VA)
- No personalization

Custom mock worker:
- Configurable question distribution
- Personalized prompts based on:
  - Target metrics (core reasoning skills)
  - Weak areas (question types, genres)
  - Difficulty targeting
  - User analytics

### 4. Time Limits
Custom mock worker supports:
- Overall time limit for the mock (`time_limit_minutes`)
- Per-question time limits (`per_question_time_limit`)

### 5. Multiple Genres
- Daily: One genre per day
- Custom: Can specify multiple genres or let system choose

## API Reference

### Main Function

```typescript
export async function runCustomizedMock(params: CustomizedMockRequest): Promise<CustomizedMockResult>
```

**Request Schema (CustomizedMockRequest):**

```typescript
{
  user_id: string;              // REQUIRED: User creating the mock
  mock_name?: string;            // Optional: Name for the mock (default: "Custom Mock Test")

  // Content specifications
  target_genres?: string[];      // Optional: Genres to target (default: mixed)
  num_passages: number;           // REQUIRED: Number of passages (1-5)
  total_questions: number;         // REQUIRED: Total questions (5-50)

  // Question distribution
  question_type_distribution?: {
    rc_questions: number;           // RC questions per passage
    para_summary: number;          // Para summary questions
    para_completion: number;        // Para completion questions
    para_jumble: number;         // Para jumble questions
    odd_one_out: number;         // Odd one out questions
  };

  // Difficulty targeting
  difficulty_target: "easy" | "medium" | "hard" | "mixed";  // Default: "mixed"

  // Personalization parameters
  target_metrics?: string[];       // Specific core metrics to target
  weak_areas_to_address?: string[]; // Weak question types/genres to focus on

  // Time constraints
  time_limit_minutes?: number;      // Optional: Time limit for entire mock (10-180 min)
  per_question_time_limit?: number; // Optional: Per-question limit (30-300 sec)

  // User analytics (for personalization)
  user_analytics?: {
    accuracy_percentage: number;
    genre_performance: Record<string, any>;
    question_type_performance: Record<string, any>;
    weak_topics: string[];
    weak_question_types: string[];
  };
}
```

**Response Schema (CustomizedMockResult):**

```typescript
{
  success: boolean;
  exam_id?: string;           // Generated exam ID
  mock_name?: string;
  passage_count: number;        // Number of passages generated
  question_count: number;       // Total questions generated
  user_id: string;
  time_limit_minutes?: number;
  message: string;            // Success/error message
}
```

## Workflow Phases

### Phase 1: Preparation & Retrieval
1. Select genres (from request or defaults)
2. Fetch valid articles with smart checking:
   - Check if `used_in_daily` → skip
   - Check if `used_in_custom_exam` → verify user usage
   - Fetch from web only if no valid articles found
3. Extract semantic ideas and authorial persona
4. Generate embedding and fetch PYQ references

### Phase 2: Passage Generation (for each article)
1. Extract semantic ideas and persona from article
2. Generate CAT-style passage with personalization
3. Finalize passage with metadata

### Phase 3: RC Questions (for each passage)
1. Generate RC questions with personalization
2. Select correct answers

### Phase 4: VA Questions
1. Generate all VA question types based on distribution
2. Select correct answers

### Phase 5: Graph & Rationales
1. Fetch reasoning graph nodes
2. Tag questions with metrics
3. Build graph context for rationales
4. Generate elimination-driven rationales

### Phase 6: Finalization
1. Format output for database upload
2. Validate all data
3. Save to database:
   - exam_papers
   - passages
   - questions
   - Update genre usage counts

## Article Usage Logic

### Smart Checking Algorithm

```
For each article request:
  1. Check database for articles matching genre
  2. Filter: NOT used_in_daily
  3. Filter: URL not in excluded list
  4. If used_in_custom_exam:
       - Check if used by THIS user
       - If yes → skip (already used)
       - If no → use (new to this user)
  5. If no valid article found:
       - Search web for new article
       - Fetch and save with flags set correctly
```

### Database Updates

When an article is used in custom mock:
- `used_in_custom_exam` → true
- `custom_exam_usage_count` → incremented
- `last_used_at` → current timestamp

When a passage is created:
- `paper_id` → links to exam
- Genre usage count updated

## Personalization Examples

### Example 1: Target Specific Metrics

```typescript
{
  user_id: "user-123",
  num_passages: 2,
  total_questions: 15,
  target_metrics: ["inference", "critical_thinking", "logical_reasoning"]
}
```

This generates questions that specifically test these reasoning skills.

### Example 2: Address Weak Areas

```typescript
{
  user_id: "user-123",
  num_passages: 1,
  total_questions: 10,
  weak_areas_to_address: ["tone_analysis", "inference", "para_jumble"],
  question_type_distribution: {
    rc_questions: 4,
    para_jumble: 3,
    para_completion: 2,
    para_summary: 1
  }
}
```

This generates more questions targeting the user's weak areas.

### Example 3: Difficulty Targeting

```typescript
{
  user_id: "user-123",
  num_passages: 2,
  total_questions: 12,
  difficulty_target: "hard",
  question_type_distribution: {
    rc_questions: 6,
    para_summary: 2,
    para_jumble: 2,
    para_completion: 2
  }
}
```

This generates harder questions to challenge the user.

## Database Schema Updates

### Tables Used

1. **exam_papers**
   - New row for each custom mock
   - `used_articles_id`: Array of article IDs used
   - `generated_by_user_id`: User who created the mock

2. **passages**
   - One row per generated passage
   - `paper_id`: Links to exam
   - `is_daily_pick`: false (custom mock)

3. **questions**
   - Multiple rows (RC + VA)
   - `paper_id`: Links to exam
   - `passage_id`: Links to passage for RC, null for VA

4. **articles**
   - `used_in_custom_exam`: Updated when article is used
   - `custom_exam_usage_count`: Incremented
   - `last_used_at`: Updated

5. **genres**
   - `custom_exam_usage_count`: Incremented
   - `last_used_custom_exam_at`: Updated

## Error Handling

The worker includes comprehensive error handling:
- Try-catch blocks around all phases
- Graceful degradation (continues with partial results if possible)
- Detailed logging at each step
- Validation before database upload

## Logging Format

Follows the same pattern as daily-content:
- 🚀 [START] Phase initiation
- 📋 [Step X/Y] Phase steps
- ⏳ Waiting for LLM response... (before API calls)
- ✅ Success completions
- ⚠️ Warnings
- ❌ Errors with context

## Deployment

### 1. Bundle for Edge Functions

Create a bundling script similar to daily-content:

```javascript
// services/scripts/bundle-customized-mocks-edge-function.js
```

### 2. Deploy

```bash
cd services
npm run bundle:custom-mocks  # If you add the script
supabase functions deploy customized-mocks
```

### 3. Environment Variables

Required:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing

### Local Testing

```typescript
import { runCustomizedMock } from "./workers/customized-mocks/runCustomizedMock";

await runCustomizedMock({
  user_id: "test-user-id",
  mock_name: "Test Custom Mock",
  num_passages: 2,
  total_questions: 10,
  question_type_distribution: {
    rc_questions: 6,
    para_summary: 1,
    para_completion: 1,
    para_jumble: 1,
    odd_one_out: 1
  },
  difficulty_target: "medium"
});
```

### Edge Function Testing

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/customized-mocks' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "user-uuid",
    "num_passages": 2,
    "total_questions": 15
  }'
```

## Notes

1. **CAT-Like Quality**: Maintains same CAT-quality prompts as daily-content, only adding personalization
2. **Database Consistency**: Properly updates all count fields (articles, genres, etc.)
3. **Article Deduplication**: Smart checking prevents reusing articles for same user
4. **Scalability**: Supports 1-5 passages, 5-50 questions
5. **Flexibility**: Fully configurable question distribution and difficulty

## Future Enhancements

- [ ] Add support for specific time limits per passage
- [ ] Adaptive difficulty based on real-time performance
- [ ] Support for mixed difficulty within same mock
- [ ] Advanced personalization based on detailed analytics patterns
- [ ] Support for collaborative mock creation
