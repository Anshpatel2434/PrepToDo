# VA Questions Updates Based on Feedback

## Changes Made

### 1. Passage Links to Exam
**File:** `retrieval/vaQuestionsHandling/formatOutputForDB.ts`

Changed `paper_id` from `null` to `exam.id` in the Passage object. This ensures proper linkage between exam and passage.

### 2. Odd One Out Updated to 5 Sentences
**Files:**
- `retrieval/vaQuestionsHandling/generateOddOneOutQuestions.ts` (NEW)
- `schemas/types.ts` - Updated JumbledSentencesSchema

The odd_one_out question now:
- Has 5 jumbled sentences (keys "1" through "5")
- 4 sentences share a common theme
- 1 sentence is the "odd one out"
- correct_answer is the number of the odd sentence (1-5)
- options is null

### 3. Question Schema Made Optional
**File:** `schemas/types.ts`

Changed `options` and `jumbled_sentences` to optional fields in QuestionSchema. This allows:
- para_jumble: jumbled_sentences populated, options empty
- odd_one_out: both jumbled_sentences populated, options empty
- Other types: options populated, jumbled_sentences empty

## New File Structure

```
retrieval/vaQuestionsHandling/
├── generateVAQuestions.ts       # Main orchestrator (imports generateOddOneOutQuestions)
├── generateOddOneOutQuestions.ts  # NEW: Generates odd_one_out questions
├── generateVARationales.ts      # VA rationale generator
├── selectVAAnswers.ts           # VA answer selector
├── tagVAQuestionsWithNodes.ts   # VA question tagger
└── formatOutputForDB.ts         # Output formatter
```

## Output Format Updates

### Exam
```json
{
  "id": "uuid",
  "name": "Daily Practice",
  "year": 2025,
  "exam_type": "CAT",
  "slot": null,
  "is_official": false,
  "created_at": "ISO timestamp"
}
```

### Passage
```json
{
  "id": "uuid",
  "paper_id": "exam uuid",  // LINKED TO EXAM
  "content": "...",
  "word_count": 650,
  "genre": "Society & Culture",
  "difficulty": "medium",
  ...
}
```

### Questions - Odd One Out
```json
{
  "id": "uuid",
  "passage_id": null,
  "question_text": "Five jumbled up sentences, related to a topic, are given below. Four of them can be put together to form a coherent paragraph. Identify the odd one out and key in the number of sentence as your answer:",
  "question_type": "odd_one_out",
  "options": null,  // NO OPTIONS
  "jumbled_sentences": {
    "1": "<sentence>",
    "2": "<sentence>",
    "3": "<sentence>",
    "4": "<sentence>",
    "5": "<sentence>"
  },
  "correct_answer": { "answer": "3" },  // NUMBER OF ODD SENTENCE
  "rationale": "...",
  "difficulty": "medium",
  "tags": [],
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Questions - Para Jumble
```json
{
  "id": "uuid",
  "passage_id": null,
  "question_text": "The four sentences (labelled 1, 2, 3 and 4) below, when properly sequenced would yield a coherent paragraph. Decide on the proper sequencing of the order of the sentences and key in the sequence of the four numbers as your answer:",
  "question_type": "para_jumble",
  "options": {  // ORDERING OPTIONS
    "A": "1234",
    "B": "2134",
    "C": "1324",
    "D": "1243"
  },
  "jumbled_sentences": {  // 4 SENTENCES
    "1": "<sentence>",
    "2": "<sentence>",
    "3": "<sentence>",
    "4": "<sentence>"
  },
  "correct_answer": { "answer": "3214" },
  "rationale": "...",
  "difficulty": "medium",
  "tags": [],
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Questions - Para Summary
```json
{
  "id": "uuid",
  "passage_id": null,
  "question_text": "The passage given below is followed by four alternate summaries. Choose the option that best captures the essence of the passage. [PASSAGE TEXT]",
  "question_type": "para_summary",
  "options": {  // 4 OPTIONS
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "jumbled_sentences": null,
  "correct_answer": { "answer": "D" },
  "rationale": "...",
  "difficulty": "medium",
  "tags": [],
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Questions - Para Completion
```json
{
  "id": "uuid",
  "passage_id": null,
  "question_text": "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide in which blank (option 1, 2, 3, or 4) the following sentence would best fit.\n[PARAGRAPH WITH BLANKS]",
  "question_type": "para_completion",
  "options": {  // 4 OPTIONS
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "jumbled_sentences": null,
  "correct_answer": { "answer": "B" },
  "rationale": "...",
  "difficulty": "medium",
  "tags": [],
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

## Implementation Notes

1. **Paper ID Linkage**: The passage now properly links to the exam via `paper_id = exam.id`

2. **Odd One Out Format**:
   - Uses 5 sentences (4 similar + 1 odd one)
   - Similar sentences placed in keys "1" through "4"
   - Odd one placed in key "5"
   - Options is null (no options, just sentence identification)
   - correct_answer is the number (1-5)

3. **Optional Fields**:
   - `options` and `jumbled_sentences` are now optional
   - This allows different question types to use different fields appropriately

## Testing

Run the test to see the updated output:

```bash
cd services/workers/daily-content
npx ts-node runJustReadingTest.ts
```

Check `justReadingOutput.json` to verify:
- Exam, Passage, and Questions are properly linked
- odd_one_out has 5 sentences with correct_answer as number
- para_jumble has 4 sentences with ordering options
- para_summary and para_completion have 4 options

## Summary of Changes

1. ✅ passage.paper_id now links to exam.id
2. ✅ odd_one_out uses 5 sentences (4 similar + 1 odd)
3. ✅ JumbledSentencesSchema updated to include key "5"
4. ✅ Options and jumbled_sentences are optional fields
5. ✅ Created separate file for odd_one_out generation
6. ✅ All formatting matches provided examples
