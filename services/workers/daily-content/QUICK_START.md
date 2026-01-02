# Quick Start Guide - VA Questions Implementation

## Installation

No additional packages needed! The implementation uses built-in features only.

## Running the Test

### Method 1: Using testVAQuestions.ts (Full Test)

```bash
cd services/workers/daily-content
npx ts-node testVAQuestions.ts
```

This runs the complete daily content generation and outputs JSON to console.

### Method 2: Using runJustReadingTest.ts (Simpler Test)

```bash
cd services/workers/daily-content
npx ts-node runJustReadingTest.ts
```

This runs the complete workflow and saves output to `justReadingOutput.json`.

## What Gets Generated

The test generates:

1. **Exam** - Exam metadata
   - Name: "Daily Practice"
   - Year: Current year
   - Type: CAT
   - Slot: null
   - Official: false

2. **Passage** - CAT-style passage
   - 500-800 words
   - Based on semantic ideas and authorial persona
   - Evaluated and sharpened to CAT standards

3. **Questions** - 4-8 total
   - 4 RC questions (Reading Comprehension)
     - passage_id = passage.id
     - options populated
     - Tests inference, tone, detail, main idea
   
   - Up to 4 VA questions (Verbal Ability)
     - 1 para_summary (finds best summary)
     - 1 para_completion (completes paragraph logically)
     - 1 para_jumble (orders jumbled sentences)
     - 1 odd_one_out (finds odd sentence)
     - All have passage_id = null
     - para_jumble has jumbled_sentences, no options
     - odd_one_out has jumbled_sentences + options

## Expected Output Format

```json
{
  "exam": {
    "id": "uuid",
    "name": "Daily Practice",
    "year": 2025,
    "exam_type": "CAT",
    "slot": null,
    "is_official": false,
    "created_at": "2025-01-02T..."
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
    "created_at": "2025-01-02T...",
    "updated_at": "2025-01-02T..."
  },
  "questions": [
    // RC questions first, then VA questions
  ]
}
```

## Verifying the Output

After running the test, check:

1. **RC Questions** - Should be accurate (same as before)
   - Questions are inference-based
   - Options have traps
   - Rationales use graph-driven elimination

2. **VA Questions** - New, need quality check
   - para_summary: Options include too broad, too narrow, distortions
   - para_completion: Options include contradicts, irrelevant, too specific
   - para_jumble: Options are different orderings (e.g., "1234")
   - odd_one_out: 3 sentences share theme, 1 differs meaningfully

3. **Rationales** - All use reasoning graph
   - Hidden rubric approach
   - Elimination-based explanations
   - No prompt scaffolding leakage

## Integration into Production

To use in your existing workflow:

```typescript
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";

// ... your existing code ...

// Replace the return statement with:
const result = await runCompleteDailyContent({
    semanticIdeas: semantic_ideas,
    authorialPersona: authorial_persona,
    genre: genre.name,
    passagesMatches: matches.passages,
    questionsMatches: matches.questions,
});

// Result contains:
// - result.exam (Exam data)
// - result.passage (Passage data)
// - result.questions (All questions: RC + VA)

// Upload to database
await uploadToSupabase(result);
```

## Troubleshooting

### Error: Cannot find module 'uuid'
- This should not happen anymore - removed dependency
- If you see this, check your imports

### Error: No reference data for [question type]
- This is expected if database doesn't have that question type
- The system will skip that type and continue
- Check logs for warnings

### Error: Invalid schema
- Check that all types are imported from `schemas/types.ts`
- No new types should be created
- Contact support if issue persists

## File Locations

All new files are in:
```
services/workers/daily-content/retrieval/vaQuestionsHandling/
├── generateVAQuestions.ts
├── generateVARationales.ts
├── selectVAAnswers.ts
├── tagVAQuestionsWithNodes.ts
├── formatOutputForDB.ts
└── runVAQuestions.ts
```

Test runners:
```
services/workers/daily-content/
├── testVAQuestions.ts
└── runJustReadingTest.ts
```

Documentation:
```
services/workers/daily-content/
├── VA_README.md
├── IMPLEMENTATION_NOTES.md
└── CHANGES_SUMMARY.md
```

## Next Steps

1. ✅ Run test to verify it works
2. ⏳ Review output quality
3. ⏳ Check VA questions meet standards
4. ⏳ Adjust prompts if needed
5. ⏳ Integrate into production workflow
6. ⏳ Add database upload function

## Questions?

For detailed documentation, see:
- `VA_README.md` - Complete implementation guide
- `IMPLEMENTATION_NOTES.md` - Implementation details
- `CHANGES_SUMMARY.md` - Summary of all changes
