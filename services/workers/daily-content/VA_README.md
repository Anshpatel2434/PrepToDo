# VA Questions Implementation

## Overview

This implementation adds support for generating VA (Verbal Ability) questions of four types:
1. **para_summary** - Identify the best summary of a paragraph
2. **para_completion** - Complete a paragraph with the most logical sentence
3. **para_jumble** - Arrange jumbled sentences in the correct order
4. **odd_one_out** - Identify the sentence that doesn't belong with the others

## File Structure

```
services/workers/daily-content/
├── retrieval/
│   ├── passageHandling/
│   │   ├── extractSemanticIdeas.ts (UPDATED - added sentence-level ideas extraction)
│   │   └── generatePassage.ts (UPDATED - improved prompts)
│   ├── rcQuestionsHandling/
│   │   └── generateRCQuestions.ts (UPDATED - exported helper function)
│   └── vaQuestionsHandling/ (NEW)
│       ├── generateVAQuestions.ts
│       ├── generateVARationales.ts
│       ├── selectVAAnswers.ts
│       ├── tagVAQuestionsWithNodes.ts
│       ├── formatOutputForDB.ts
│       └── runVAQuestions.ts
├── schemas/
│   └── types.ts (UPDATED - added new fields to SemanticIdeasSchema)
├── testVAQuestions.ts (NEW - test runner)
└── justReading.js (existing - sample output)
```

## Key Changes

### 1. Enhanced Semantic Extraction (`extractSemanticIdeas.ts`)

Added three new fields to `SemanticIdeasSchema`:
- `sentence_ideas`: 5-10 key sentence-level ideas for VA questions
- `conceptual_pairs`: 3-5 pairs of related ideas for odd_one_out questions
- `logical_transitions`: 3-5 key connectors for understanding flow

### 2. Improved Passage Generation (`generatePassage.ts`)

Updated prompts to include:
- CAT passage source characteristics (journals, magazines, books, etc.)
- Optimal word count range (500-800 words)
- Layered argumentation structure
- High lexical density requirements

### 3. VA Question Generation (`generateVAQuestions.ts`)

Creates separate prompts for each question type:
- **para_summary**: Uses semantic ideas to create a paragraph, asks for best summary
- **para_completion**: Creates incomplete paragraph, asks for logical completion
- **para_jumble**: Creates 4 jumbled sentences, asks for correct ordering
- **odd_one_out**: Creates 4 sentences where 3 share a theme, asks to identify the odd one

Each type:
- Uses reference PYQs for pattern learning
- Follows CAT-style option construction
- Generates 1 question per type
- Leaves correct_answer and rationale empty (filled in subsequent steps)

### 4. VA Rationale Generation (`generateVARationales.ts`)

Uses the same graph-driven approach as RC questions:
- Hidden rubric: reasoning graph with nodes and edges
- Elimination-based rationales
- No prompt scaffolding leakage
- Emulates PYQ rationale variety

### 5. VA Answer Selection (`selectVAAnswers.ts`)

Identifies correct answers for all VA questions:
- Para-summary: best comprehensive summary
- Para-completion: logical completion
- Para-jumble: coherent ordering
- Odd-one-out: the sentence that differs meaningfully

### 6. VA Question Tagging (`tagVAQuestionsWithNodes.ts`)

Tags each VA question with:
- Primary reasoning node (main skill tested)
- Secondary reasoning nodes (skills distractors engage)

### 7. Output Formatting (`formatOutputForDB.ts`)

Formats final output as 3 data structures ready for DB upload:
- **Exam**: { id, name: "Daily Practice", year: current, exam_type: "CAT", slot: null, is_official: false }
- **Passage**: Complete passage metadata (id, content, word_count, genre, difficulty, etc.)
- **Questions**: All questions (RC + VA)
  - RC questions: passage_id = passage.id
  - VA questions: passage_id = null
  - para_jumble & odd_one_out: jumbled_sentences populated, options empty
  - Other types: options populated, jumbled_sentences empty

### 8. Complete Workflow (`runVAQuestions.ts`)

`runCompleteDailyContent()` function:
1. Fetches reference passages and questions
2. Generates CAT-style passage
3. Finalizes passage (evaluate + sharpen)
4. Generates 4 RC questions
5. Generates up to 4 VA questions (1 of each type)
6. Selects correct answers for all questions
7. Tags all questions with reasoning nodes
8. Builds reasoning graph context for all questions
9. Generates rationales for all questions
10. Formats output for DB upload
11. Validates output
12. Generates report

## Usage

### Running the Test

```bash
cd services/workers/daily-content
npm install uuid
npx ts-node testVAQuestions.ts
```

### Using in Your Code

```typescript
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";
import { semantic_ideas, authorial_persona, genreName } from "./retrieval/articleTestForTesting";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";

// Generate embedding
const embedding = await generateEmbedding(genreName);

// Search for similar content
const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);

// Run complete workflow
const result = await runCompleteDailyContent({
    semanticIdeas: semantic_ideas,
    authorialPersona: authorial_persona,
    genre: genreName,
    passagesMatches: matches.passages,
    questionsMatches: matches.questions,
});

// Access output
console.log("Exam:", result.exam);
console.log("Passage:", result.passage);
console.log("Questions:", result.questions);
```

## Output Format

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
    {
      "id": "uuid",
      "passage_id": "uuid",  // null for VA questions
      "question_text": "...",
      "question_type": "rc_question",  // or "para_summary", "para_completion", "para_jumble", "odd_one_out"
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },  // empty for para_jumble and odd_one_out
      "jumbled_sentences": { "1": "...", "2": "...", "3": "...", "4": "..." },  // populated for para_jumble and odd_one_out
      "correct_answer": { "answer": "A" },
      "rationale": "...",
      "difficulty": "medium",
      "tags": ["...", "..."],
      "created_at": "2025-01-02T...",
      "updated_at": "2025-01-02T..."
    }
  ]
}
```

## Important Notes

1. **Try-Catch Safety**: All functions include try-catch blocks to prevent crashes
2. **Output Format**: Maintains exact compatibility with existing schemas
3. **Type Declarations**: All types imported from `schemas/types.ts`
4. **Prompts**: Follow the same style as RC question generation prompts
5. **Reference Data**: Filters reference questions by type for targeted learning
6. **Graph-Driven Rationales**: Uses reasoning graph for both RC and VA questions
7. **Validation**: Includes validation function to check output before DB upload
8. **Error Handling**: Gracefully handles missing reference data and generation failures

## Testing

The test runner (`testVAQuestions.ts`) will:
1. Generate embedding for the test genre
2. Search for similar passages/questions
3. Run the complete workflow
4. Print a formatted report
5. Output the final JSON ready for DB upload

## Future Enhancements

Potential improvements:
- Add more VA question types (critical_reasoning, vocab_in_context, etc.)
- Improve para_jumble difficulty by creating more ambiguous sentences
- Add configuration for number of questions per type
- Add batch processing for multiple passages
- Add DB upload functionality
