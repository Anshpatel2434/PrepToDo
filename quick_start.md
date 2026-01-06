# Quick Start Guide

This guide provides essential information for coding in this project. Review this before making changes.

---

## Project Overview

This is a CAT (Common Admission Test) VARC (Verbal Ability and Reading Comprehension) practice content generation platform.

- **Frontend**: React + Vite + TypeScript (under `apps/web/`)
- **Backend**: Node.js + TypeScript (under `services/`)
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: OpenAI GPT-4o-mini for content generation
- **Edge Functions**: Supabase Edge Functions (Deno runtime)

---

## Project Structure

```
/
├── apps/
│   └── web/                      # Frontend (React + Vite)
├── services/
│   ├── config/                   # Configuration files
│   │   ├── openai.ts            # OpenAI client instance
│   │   └── supabase.ts          # Supabase client instance
│   ├── workers/
│   │   └── daily-content/       # Main workflow for daily content generation
│   │       ├── retrieval/       # Data fetching and question generation
│   │       ├── graph/           # Reasoning graph operations
│   │       ├── schemas/         # Type definitions with Zod
│   │       └── runDailyContent.ts # Main orchestrator
│   ├── scripts/
│   │   └── bundle-edge-function.js # Bundling script for Deno deployment
│   └── index.ts                 # Backend entry point
└── supabase/
    └── functions/
        └── daily-content/       # Edge function bundle
```

---

## Tech Stack & Key Dependencies

### Backend Services (`services/`)
- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Key Libraries**:
  - `openai` - OpenAI API client
  - `@supabase/supabase-js` - Supabase client
  - `zod` - Schema validation
  - `uuid` - UUID generation
  - `esbuild` - Bundling for edge functions

### Supabase Edge Functions
- **Runtime**: Deno Edge (NOT Node.js)
- **Bundling**: esbuild with `platform: "neutral"`
- **External deps**: Imported via esm.sh CDN (not npm)

---

## Code Style Conventions

### 1. Import Style
```typescript
// Use named imports from local files
import { openai } from "../../config/openai";
import { supabase } from "../../config/supabase";
import { QuestionSchema, Passage } from "../schemas/types";
```

### 2. Async/Await
All async operations should use async/await:
```typescript
export async function someFunction() {
    try {
        const result = await openai.embeddings.create({...});
        return result;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}
```

### 3. Logging Pattern
Use emoji prefixes and structured logging:
```typescript
console.log("🚀 [START] Daily Content Generation sequence initiated");
console.log("📄 [Step 1/5] Fetching articles");
console.log("⏳ [Embedding] Waiting for OpenAI embeddings response");
console.log("✅ [Complete] Generation finished");
```

**IMPORTANT**: Always include `⏳ Waiting for LLM response...` immediately before any OpenAI API call.

### 4. Error Handling
```typescript
try {
    // operation
} catch (error) {
    console.error("❌ [Error Name] Description:", error);
    throw error; // Re-throw for upstream handling
}
```

### 5. Type Safety with Zod
Define schemas with Zod and infer types:
```typescript
import { z } from "zod";

export const QuestionSchema = z.object({
    id: z.string().uuid(),
    question_text: z.string(),
    question_type: z.enum(["rc_question", "para_summary", ...]),
    options: z.object({ A: z.string(), B: z.string(), ... }),
    difficulty: z.enum(["easy", "medium", "hard"]),
});

export type Question = z.infer<typeof QuestionSchema>;
```

### 6. OpenAI Integration
Use structured prompts with zod response format:
```typescript
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

const ResponseSchema = z.object({
    questions: z.array(QuestionSchema),
});

const prompt = `... your prompt ...`;

console.log("⏳ [Function] Waiting for LLM response");

const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.3,
    messages: [
        { role: "system", content: "System instructions" },
        { role: "user", content: prompt }
    ],
    response_format: zodResponseFormat(ResponseSchema, "response_name"),
});

const parsed = completion.choices[0].message.parsed;
```

### 7. Supabase Database Operations
```typescript
import { supabase } from "../../config/supabase";

// Insert data
const { data, error } = await supabase
    .from("table_name")
    .insert([record])
    .select();

if (error) throw new Error(`Insert failed: ${error.message}`);

// Query data
const { data: records, error: queryError } = await supabase
    .from("table_name")
    .select("*")
    .in("column_name", valueArray);
```

---

## Daily Content Workflow

The main workflow is in `services/workers/daily-content/runDailyContent.ts`:

### Pipeline Steps:
1. **Genre Selection** - Fetch genre for today
2. **Article Fetching** - Get valid article with text from database
3. **Semantic Extraction** - Extract semantic ideas and authorial persona
4. **Embedding & Retrieval** - Generate embeddings, fetch PYQ references
5. **Passage Generation** - Generate CAT-style passage with semantic ideas
6. **RC Questions** - Generate 4 reading comprehension questions
7. **Answer Selection (RC)** - Select correct answers for RC questions
8. **VA Questions** - Generate para-summary, para-completion, para-jumble questions
9. **Answer Selection (VA)** - Select correct answers for VA questions
10. **Graph Context** - Tag questions with reasoning graph nodes
11. **Rationale Generation (RC)** - Generate elimination-driven rationales
12. **Rationale Generation (VA)** - Generate elimination-driven rationales
13. **Output Formatting** - Format data for database upload
14. **Database Upload** - Save exam, passage, and questions to Supabase

---

## Reasoning Graph Integration

The project uses a reasoning graph to drive elimination-based rationales:

- **Nodes** (`graph/fetchNodes.ts`): Individual reasoning steps
- **Edges** (from `graph_edges` table): Relationships between nodes (supports, misleads_into, requires, validates)
- **Tagging** (`tagQuestionsWithNodes`): Map questions to primary reasoning nodes
- **Context Building** (`createReasoningGraphContext.ts`): Build reasoning paths for each question
- **Rationale Generation** (`generateRationalesWithEdges`): Use graph edges to drive elimination explanations

---

## Prompting Conventions

### RC Question Generation
- Uses PYQ reference passages/questions as in-context training
- Explicit CAT RC question taxonomy anchor (broad understanding / inference / data-based)
- Explicit trap construction + validation checklist
- Difficulty targets to prevent uniform difficulty output

### Rationale Generation
- Uses reasoning graph edges/nodes as a **hidden rubric**
- Must drive elimination choices (why each option is wrong)
- Must NOT leak prompt scaffolding (no "PART 1", no "requires → ..." labels)
- Output should emulate PYQ rationale variety

---

## Supabase Edge Functions

### Deno Compatibility Requirements

**CRITICAL**: Edge functions run on Deno, NOT Node.js. You CANNOT use:

- ❌ Node.js built-ins: `fs`, `path`, `crypto`, `stream`, `http`, `https`, `vm`, etc.
- ❌ Node.js-specific npm packages

You CAN use:
- ✅ Pure JavaScript/TypeScript code
- ✅ Web APIs (fetch, URL, crypto)
- ✅ Deno-compatible packages via CDN (esm.sh, deno.land/x)

### Bundling Process

```bash
cd services
npm run bundle:edge    # Creates bundled.ts in supabase/functions/daily-content/
supabase functions deploy daily-content
```

The bundling script (`scripts/bundle-edge-function.js`):
1. Uses esbuild with `platform: "neutral"`
2. Converts npm imports to esm.sh CDN URLs
3. Outputs to `supabase/functions/daily-content/bundled.ts`

### Environment Variables Required
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Set with: `supabase secrets set VAR_NAME=value`

---

## Running the Code

### Backend (Node.js)
```bash
cd services
npm install
npm start              # Run the daily content workflow
```

### Edge Functions (Deno)
```bash
cd services
npm run bundle:edge    # Bundle the function
supabase functions deploy daily-content
# or
supabase functions serve daily-content  # Local testing
```

### Frontend (Vite)
```bash
cd apps/web
npm install
npm run dev           # Start dev server
```

---

## Common Patterns

### UUID Generation
```typescript
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

### ISO Timestamps
```typescript
const now = new Date().toISOString();
```

### Schema Validation
```typescript
import { ZodError } from "zod";

try {
    const validated = QuestionSchema.parse(rawData);
} catch (error) {
    if (error instanceof ZodError) {
        console.error("Validation failed:", error.errors);
    }
}
```

---

## Important Notes

1. **No Node.js in Edge Functions**: Always bundle before deploying. Ensure no Node.js built-ins are used in code that will run in edge functions.

2. **Consistent Logging**: Follow the emoji prefix pattern. Always log before/after LLM calls.

3. **Type Safety**: Use Zod schemas for all data structures. Infer types from schemas.

4. **Error Handling**: Always catch errors, log them with context, and re-throw if needed for upstream handling.

5. **Database Operations**: Use the centralized Supabase client from `services/config/supabase.ts`.

6. **Prompt Engineering**: When modifying prompts, maintain the structured format with clear sections (SYSTEM, USER, STEP 1, STEP 2, etc.).

---

## Testing

To test changes locally:
```bash
cd services
npm start  # Runs runDailyContent() pipeline
```

Review the output logs for each phase. The pipeline generates:
- A CAT-style passage
- 4 RC questions with rationales
- 3+ VA questions (summary, completion, jumble) with rationales
- All saved to Supabase database

---

## Memory for Future Tasks

When working on this codebase:

- The daily content worker lives under `services/workers/daily-content/`
- Main workflow: `runDailyContent.ts`
- Schema definitions: `schemas/types.ts`
- Config: `config/openai.ts` and `config/supabase.ts`
- Edge function bundle: run `npm run bundle:edge` before deploying
- Always check for Deno compatibility when editing code that will be bundled
- Follow logging pattern with emoji prefixes
- Use "⏳ Waiting for LLM response..." before OpenAI calls
