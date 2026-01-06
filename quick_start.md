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

### Frontend (`apps/web/`)
- **Framework**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite 7
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **UI Library**: Framer Motion (animations), React Icons, React Hot Toast (notifications)
- **Authentication**: Supabase Auth
- **Database**: Supabase Client

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

## Frontend Code Conventions

### 1. Project Structure (apps/web/)

```
apps/web/src/
├── context/              # React Context providers
│   └── ThemeContext.tsx  # Light/Dark theme management
├── pages/                # Feature-based page components
│   ├── auth/            # Authentication pages
│   ├── daily/           # Daily practice (RC/VA)
│   ├── dashboard/       # User dashboard
│   ├── home/            # Landing page
│   └── teach-concept/   # Concept teaching
├── services/            # API client and external services
│   └── apiClient.ts     # Supabase client configuration
├── store/               # Redux store configuration
│   └── index.ts         # Central store setup
├── types/               # Shared TypeScript type definitions
│   └── index.ts         # Zod schemas + inferred types
├── ui_components/       # Reusable UI components
│   ├── FloatingNavigation.tsx
│   └── ThemeToggle.tsx
├── App.tsx              # Root component with routing
└── main.tsx             # Application entry point
```

### 2. React Component Guidelines

#### Functional Components with Hooks
```typescript
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

const MyComponent: React.FC = () => {
    // State
    const [data, setData] = useState<Type | null>(null);

    // Redux hooks
    const dispatch = useDispatch();
    const someState = useSelector(selectSomeState);

    // Callbacks
    const handleClick = useCallback(() => {
        // handler logic
    }, [dependency]);

    // Effects
    useEffect(() => {
        // initialization or cleanup
        return () => {
            // cleanup
        };
    }, [dependency]);

    return (
        <div>
            {/* JSX */}
        </div>
    );
};

export default MyComponent;
```

#### Component Organization
- Keep components focused on a single responsibility
- Use TypeScript for all props and state
- Prefer functional components with hooks over class components
- Use proper React key props for lists

### 3. State Management with Redux Toolkit

#### Redux Store Configuration
The store uses Redux Toolkit with RTK Query for server state:

```typescript
// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";

export const store = configureStore({
    reducer: {
        // Slices for local state
        auth: authReducer,
        dailyPractice: dailyPracticeReducer,

        // RTK Query APIs for server state
        [authApi.reducerPath]: authApi.reducer,
        [dailyPracticeApi.reducerPath]: dailyPracticeApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            dailyPracticeApi.middleware
        ),
});

setupListeners(store.dispatch);
```

#### Creating a Slice
```typescript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface StateType {
    value: number;
    loading: boolean;
}

const initialState: StateType = {
    value: 0,
    loading: false,
};

const mySlice = createSlice({
    name: "myFeature",
    initialState,
    reducers: {
        increment: (state) => {
            state.value += 1;
        },
        setValue: (state, action: PayloadAction<number>) => {
            state.value = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(asyncAction.pending, (state) => {
                state.loading = true;
            })
            .addCase(asyncAction.fulfilled, (state, action) => {
                state.loading = false;
                // handle success
            })
            .addCase(asyncAction.rejected, (state, action) => {
                state.loading = false;
                // handle error
            });
    },
});

export const { increment, setValue } = mySlice.actions;
export default mySlice.reducer;
```

#### Using Selectors
```typescript
// Simple selector
export const selectValue = (state: RootState) => state.myFeature.value;

// Memoized selector (using createSelector)
import { createSelector } from "@reduxjs/toolkit";

export const selectDerivedValue = createSelector(
    [selectValue, selectOtherState],
    (value, other) => {
        return value * other;
    }
);

// In component
const value = useSelector(selectValue);
```

### 4. RTK Query for API Calls

#### Creating an API Slice
```typescript
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";

export const myApi = createApi({
    reducerPath: "myApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["MyResource"],
    endpoints: (builder) => ({
        fetchResource: builder.query<ResourceType, void>({
            queryFn: async () => {
                try {
                    const { data, error } = await supabase
                        .from("table_name")
                        .select("*");

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data };
                } catch (error) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: "Error message",
                        },
                    };
                }
            },
            providesTags: ["MyResource"],
        }),
        updateResource: builder.mutation<ResourceType, UpdateParams>({
            queryFn: async ({ id, updates }) => {
                const { data, error } = await supabase
                    .from("table_name")
                    .update(updates)
                    .eq("id", id)
                    .select();

                if (error) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: error.message,
                        },
                    };
                }

                return { data: data[0] };
            },
            invalidatesTags: ["MyResource"],
        }),
    }),
});

export const {
    useFetchResourceQuery,
    useLazyFetchResourceQuery,
    useUpdateResourceMutation,
} = myApi;
```

#### Using RTK Query in Components
```typescript
// Auto-fetch with query
const { data, isLoading, error, refetch } = useFetchResourceQuery();

// Lazy fetch with mutation
const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();

const handleUpdate = async () => {
    try {
        const result = await updateResource({ id: "123", updates: { ... } }).unwrap();
        // success
    } catch (error) {
        // error handling
    }
};
```

### 5. Supabase Client Usage (Frontend)

```typescript
import { supabase } from "../../../services/apiClient";

// Authentication
const { data: { user }, error } = await supabase.auth.getUser();

// Sign in with OTP
await supabase.auth.signInWithOtp({ email });

// Verify OTP
await supabase.auth.verifyOtp({ email, token, type: "email" });

// Sign out
await supabase.auth.signOut();

// Database queries
const { data, error } = await supabase
    .from("table_name")
    .select("*")
    .eq("column", value)
    .order("created_at", { ascending: false })
    .limit(10);

// Insert
const { data, error } = await supabase
    .from("table_name")
    .insert([{ ... }])
    .select();

// Update
const { data, error } = await supabase
    .from("table_name")
    .update({ ... })
    .eq("id", id)
    .select();

// Real-time subscription
const subscription = supabase
    .channel("custom-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "table_name" }, (payload) => {
        console.log("Change:", payload);
    })
    .subscribe();

// Cleanup
return () => {
    subscription.unsubscribe();
};
```

### 6. Routing with React Router

```typescript
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MyComponent } from "./MyComponent";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/home" replace />,
    },
    {
        path: "/home",
        element: <MyComponent />,
    },
]);

function App() {
    return <RouterProvider router={router} />;
}
```

```typescript
// Navigation within components
import { useNavigate } from "react-router-dom";

const MyComponent = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate("/some-path");
    };

    return <button onClick={handleClick}>Go</button>;
};
```

### 7. Styling with Tailwind CSS

```typescript
// Using Tailwind classes
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Title
    </h2>
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Action
    </button>
</div>
```

**Dark Mode Support**: Use `dark:` prefix for dark theme styles:
```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

### 8. Type Safety with Zod (Frontend)

```typescript
import { z } from "zod";

// Define schema
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1),
    age: z.number().min(0).optional(),
});

// Infer type
export type User = z.infer<typeof UserSchema>;

// Validate at runtime
const result = UserSchema.safeParse(rawData);

if (!result.success) {
    console.error("Validation errors:", result.error.errors);
} else {
    // result.data is typed as User
}
```

### 9. Context API for App-wide State

```typescript
// ThemeContext example
import { createContext, useContext, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
};
```

### 10. Common Patterns

#### Toast Notifications
```typescript
import toast from "react-hot-toast";

toast.success("Operation successful!");
toast.error("Something went wrong");
toast.loading("Loading...");

const myToast = toast.loading("Processing...");
// Later...
toast.success("Done!", { id: myToast });
```

#### Loading States
```typescript
const { data, isLoading, error } = useSomeQuery();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Component data={data} />;
```

#### Conditional Rendering
```typescript
{condition && <Component />}

{condition ? <TrueComponent /> : <FalseComponent />}

{items.map((item) => (
    <Item key={item.id} data={item} />
))}
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

### Frontend Development (Vite)
```bash
cd apps/web
npm install
npm run dev           # Start dev server at http://localhost:5173
npm run build         # Production build
npm run preview       # Preview production build locally
npm run lint          # Run ESLint
```

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

### Environment Variables

#### Frontend (apps/web/.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (services/.env)
```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Common Patterns

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

### Backend Services
1. **No Node.js in Edge Functions**: Always bundle before deploying. Ensure no Node.js built-ins are used in code that will run in edge functions.

2. **Consistent Logging**: Follow the emoji prefix pattern. Always log before/after LLM calls.

3. **Type Safety**: Use Zod schemas for all data structures. Infer types from schemas.

4. **Error Handling**: Always catch errors, log them with context, and re-throw if needed for upstream handling.

5. **Database Operations**: Use the centralized Supabase client from `services/config/supabase.ts`.

6. **Prompt Engineering**: When modifying prompts, maintain the structured format with clear sections (SYSTEM, USER, STEP 1, STEP 2, etc.).

### Frontend
7. **TypeScript Strict Mode**: The frontend uses TypeScript strict mode. Always define types for props, state, and function parameters.

8. **Component Reusability**: Extract common UI patterns to `ui_components/` directory.

9. **Redux Usage**: Use Redux slices for local component state and RTK Query for server state. Don't mix them unnecessarily.

10. **Dark Mode**: Always include dark mode styles with `dark:` prefix in Tailwind classes.

11. **Performance**: Use `useCallback` and `useMemo` to prevent unnecessary re-renders. Use `React.memo()` for expensive components.

12. **Error Boundaries**: Implement error boundaries for critical components to prevent app crashes.

13. **Accessibility**: Use semantic HTML elements. Add `aria-label` where necessary. Ensure keyboard navigation works.

14. **Loading States**: Always provide loading states for async operations. Avoid showing blank screens during data fetching.

15. **Environment Variables**: Frontend env vars must start with `VITE_` prefix to be accessible via `import.meta.env`.

---

## Testing

### Backend Testing
```bash
cd services
npm start  # Runs runDailyContent() pipeline
```

Review the output logs for each phase. The pipeline generates:
- A CAT-style passage
- 4 RC questions with rationales
- 3+ VA questions (summary, completion, jumble) with rationales
- All saved to Supabase database

### Frontend Testing
```bash
cd apps/web
npm run dev  # Starts dev server at http://localhost:5173
npm run build  # Production build (runs TypeScript check)
npm run lint  # ESLint validation
```

**TypeScript Validation**: The build process includes TypeScript compilation:
```bash
npx tsc -b  # Check TypeScript types across the project
```

**Important**: Fix all TypeScript errors before deploying. The CI/CD pipeline will fail on type errors.

---

## Memory for Future Tasks

When working on this codebase:

### Backend Services
- The daily content worker lives under `services/workers/daily-content/`
- Main workflow: `runDailyContent.ts`
- Schema definitions: `schemas/types.ts`
- Config: `config/openai.ts` and `config/supabase.ts`
- Edge function bundle: run `npm run bundle:edge` before deploying
- Always check for Deno compatibility when editing code that will be bundled
- Follow logging pattern with emoji prefixes
- Use "⏳ Waiting for LLM response..." before OpenAI calls

### Frontend
- App entry: `apps/web/src/main.tsx`
- Root component: `apps/web/src/App.tsx` with router configuration
- Redux store: `apps/web/src/store/index.ts`
- Shared types: `apps/web/src/types/index.ts` (Zod schemas)
- Supabase client: `apps/web/src/services/apiClient.ts`
- Theme context: `apps/web/src/context/ThemeContext.tsx`
- Feature pages organized under `apps/web/src/pages/`
- API slices in each feature's `redux_usecase/` directory
- Always use TypeScript strict mode
- Use Tailwind CSS for styling with dark mode support
- Use Redux Toolkit + RTK Query for state management
- Run `npm run lint` and fix issues before committing
- Build process includes TypeScript validation - ensure no type errors
