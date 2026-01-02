# Implementation Notes for VA Questions

## What Was Done

### 1. Updated Semantic Extraction (`extractSemanticIdeas.ts`)
- Added `sentence_ideas` array for sentence-level ideas
- Added `conceptual_pairs` array for related idea pairs
- Added `logical_transitions` array for connectors
- Updated prompt to extract these new fields

### 2. Enhanced Passage Generation (`generatePassage.ts`)
- Added CAT passage source characteristics (journals, magazines, books, etc.)
- Updated optimal word count range to 500-800 words
- Added layered argumentation structure requirements
- Improved prompts with CAT-specific guidance

### 3. Created VA Question Generation Files

#### a. `generateVAQuestions.ts`
Main orchestrator for VA question generation:
- `generateVAQuestions()`: Main entry point
- `generateParaSummaryQuestions()`: Generates para_summary questions
- `generateParaCompletionQuestions()`: Generates para_completion questions
- `generateParaJumbleQuestions()`: Generates para_jumble questions
- `generateOddOneOutQuestions()`: Generates odd_one_out questions
- Each function filters reference data by question type
- Each uses its own prompt with PYQ patterns
- Includes try-catch safety for each question type

#### b. `generateVARationales.ts`
Generates rationales for VA questions:
- Uses same graph-driven approach as RC questions
- Sanitizes output to remove prompt scaffolding
- Handles para_jumble and odd_one_out special formatting

#### c. `selectVAAnswers.ts`
Selects correct answers for VA questions:
- Works for all VA question types
- Uses appropriate criteria for each type

#### d. `tagVAQuestionsWithNodes.ts`
Tags VA questions with reasoning graph nodes:
- Identifies primary reasoning node
- Identifies up to 2 secondary nodes
- Maps questions to graph structure

#### e. `formatOutputForDB.ts`
Formats output for database upload:
- `formatOutputForDB()`: Creates Exam, Passage, Questions structures
- `validateOutputForDB()`: Validates data before upload
- `generateOutputReport()`: Creates formatted summary report

#### f. `runVAQuestions.ts`
Complete workflow orchestrator:
- `runVAQuestions()`: VA questions only
- `runCompleteDailyContent()`: RC + VA questions with formatted output

### 4. Created Test Runner

#### `runJustReadingTest.ts`
Simple test runner that:
1. Uses existing test data (semantic_ideas, authorial_persona, genreName)
2. Generates embedding and searches for similar content
3. Runs complete daily content generation (RC + VA questions)
4. Saves output to `justReadingOutput.json`

## How to Use

### Option 1: Run Test with Existing Test Data

```bash
cd services/workers/daily-content
npm install uuid  # If not already installed
npx ts-node runJustReadingTest.ts
```

This will:
- Use the test semantic ideas and authorial persona from `articleTestForTesting.ts`
- Search for similar passages/questions in the database
- Generate a new passage
- Generate 4 RC questions + up to 4 VA questions
- Save output to `justReadingOutput.json`

### Option 2: Use in Production Code

```typescript
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";
import { extractSemanticIdeasAndPersona } from "./retrieval/passageHandling/extractSemanticIdeas";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";

// Your existing workflow...
const genre = await fetchGenreForToday();
const { articleMeta, articleText } = await getValidArticleWithText(genre.name);

// Extract semantic ideas
const { semantic_ideas, authorial_persona } = await extractSemanticIdeasAndPersona(articleText, genre.name);

// Search for similar content
const embedding = await generateEmbedding(genre.name);
const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);

// Run complete workflow (RC + VA)
const result = await runCompleteDailyContent({
    semanticIdeas: semantic_ideas,
    authorialPersona: authorial_persona,
    genre: genre.name,
    passagesMatches: matches.passages,
    questionsMatches: matches.questions,
});

// Upload to database
await uploadToSupabase(result);
```

## Output Structure

The output is a JSON object with 3 keys:

```json
{
  "exam": {
    "id": "uuid",
    "name": "Daily Practice",
    "year": 2025,
    "exam_type": "CAT",
    "slot": null,
    "is_official": false,
    "created_at": "ISO timestamp"
  },
  "passage": {
    "id": "uuid",
    "title": null,
    "content": "...",
    "word_count": 650,
    "genre": "Society & Culture",
    "difficulty": "medium",
    "source": null,
    "paper_id": null,
    "is_daily_pick": true,
    "is_featured": false,
    "is_archived": false,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  },
  "questions": [
    // RC questions (4 total)
    {
      "id": "uuid",
      "passage_id": "passage uuid",
      "question_text": "...",
      "question_type": "rc_question",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "jumbled_sentences": { "1": "", "2": "", "3": "", "4": "" },
      "correct_answer": { "answer": "A" },
      "rationale": "...",
      "difficulty": "medium",
      "tags": ["...", "..."],
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    },
    // VA questions (up to 4)
    {
      "id": "uuid",
      "passage_id": null,
      "question_text": "...",
      "question_type": "para_summary", // or "para_completion", "para_jumble", "odd_one_out"
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, // empty for para_jumble and odd_one_out
      "jumbled_sentences": { "1": "...", "2": "...", "3": "...", "4": "..." }, // populated for para_jumble and odd_one_out
      "correct_answer": { "answer": "A" },
      "rationale": "...",
      "difficulty": "medium",
      "tags": ["...", "..."],
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}
```

## Important Implementation Details

### 1. Try-Catch Safety
- All functions have try-catch blocks
- Error handling prevents crashes
- Graceful degradation if some question types fail

### 2. Output Format Consistency
- All types imported from `schemas/types.ts`
- No new types created
- Maintains exact compatibility with existing code

### 3. Question Type Handling

**RC Questions:**
- 4 questions generated
- passage_id = passage.id
- options populated
- jumbled_sentences empty

**VA Questions:**

**para_summary:**
- 1 question generated
- passage_id = null
- options populated
- jumbled_sentences empty

**para_completion:**
- 1 question generated
- passage_id = null
- options populated
- jumbled_sentences empty

**para_jumble:**
- 1 question generated
- passage_id = null
- options empty
- jumbled_sentences populated with 4 sentences
- Options A/B/C/D are orderings like "1234", "2134", etc.

**odd_one_out:**
- 1 question generated
- passage_id = null
- options populated
- jumbled_sentences populated with 4 sentences for reference

### 4. Reference Data Filtering
- Each VA question type filters reference data by question_type
- If no reference data exists for a type, that type is skipped
- Prevents errors and continues with other types

### 5. Graph-Driven Rationales
- Same approach as RC questions
- Uses reasoning graph as hidden rubric
- No prompt scaffolding leakage
- Elimination-based explanations

### 6. Difficulty Assignment
- Follows same pattern as RC questions
- Uses semantic ideas to determine appropriate difficulty
- Varies difficulty across questions

## Troubleshooting

### Missing uuid Package
```bash
cd services/workers/daily-content
npm install uuid
```

### Reference Data Not Found
- Ensure database has at least 5 passages with para_summary questions
- Ensure database has at least 5 passages with para_completion questions
- Ensure database has at least 5 passages with para_jumble questions
- Ensure database has at least 5 passages with odd_one_out questions

### Generation Fails
- Check semantic_ideas has required fields (sentence_ideas, conceptual_pairs, logical_transitions)
- Check embedding generation is working
- Check database connection
- Check OpenAI API key is set

## Files Modified/Created

### Modified:
1. `schemas/types.ts` - Updated SemanticIdeasSchema with new fields
2. `retrieval/passageHandling/extractSemanticIdeas.ts` - Updated prompt and schema
3. `retrieval/passageHandling/generatePassage.ts` - Updated prompts
4. `retrieval/rcQuestionsHandling/generateRCQuestions.ts` - Exported helper function
5. `runDailyContent.ts` - Updated imports

### Created:
1. `retrieval/vaQuestionsHandling/generateVAQuestions.ts`
2. `retrieval/vaQuestionsHandling/generateVARationales.ts`
3. `retrieval/vaQuestionsHandling/selectVAAnswers.ts`
4. `retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes.ts`
5. `retrieval/vaQuestionsHandling/formatOutputForDB.ts`
6. `retrieval/vaQuestionsHandling/runVAQuestions.ts`
7. `runJustReadingTest.ts`
8. `VA_README.md`
9. `IMPLEMENTATION_NOTES.md` (this file)

## Next Steps

1. Run test to verify everything works:
   ```bash
   npx ts-node runJustReadingTest.ts
   ```

2. Check `justReadingOutput.json` for the generated content

3. Review the quality of:
   - Generated passage
   - RC questions (should be accurate as before)
   - VA questions (new, need quality check)
   - Rationales for all questions

4. Adjust prompts if needed based on quality assessment

5. Integrate into production workflow

6. Add database upload function (if not already existing)
