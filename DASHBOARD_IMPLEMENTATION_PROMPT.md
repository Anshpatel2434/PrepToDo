# Dashboard Implementation Prompt - Complete Guide for AI Agent

## 🎯 OBJECTIVE
Implement a comprehensive analytics dashboard in the `apps/web/src/pages/dashboard` folder following the existing codebase patterns from the daily practice module. The dashboard should display 5 key analytics widgets using a Bento Grid layout with static rendering first, then progressive data loading.

---

## 📋 CRITICAL REQUIREMENTS

### 1. **NO REDUX SLICE** - API-Only Approach
Unlike the `daily` folder which uses a Redux slice (`dailyPracticeSlice`) for managing rapidly changing state (timer, current question, pending attempts), the dashboard does NOT need a slice because:
- No frequent state mutations
- No complex client-side state synchronization
- Data is fetched once and displayed
- State management can be handled by RTK Query cache + React component state

**Pattern to Follow:**
- Create RTK Query API file: `apps/web/src/pages/dashboard/redux_usecases/dashboardApi.ts`
- Use `createApi` with `fakeBaseQuery` (same pattern as `dailyPracticeApi.ts`)
- Export hooks like `useFetchUserAnalyticsQuery`, `useFetchUserProficiencyQuery`, etc.
- Register the API in the store's reducer and middleware

### 2. **Static Rendering with Skeleton Loaders**
Users should NOT see a large blank loader. Instead:
- Render the layout structure immediately
- Show skeleton placeholders for widgets while data is loading
- Progressive loading: widgets appear as their data arrives
- Follow the pattern in `apps/web/src/pages/daily/components/DailySkeleton.tsx`

### 3. **Use Only These Schemas (from `apps/web/src/types/index.ts`):**
```typescript
- UserAnalyticsSchema       // Daily stats: minutes, questions, accuracy, streaks, points
- UserProficiencySignalsSchema  // Rollup: genre_strengths, weak_topics, weak_question_types, recommended_difficulty
- UserMetricProficiencySchema   // Granular: dimension_type (core_metric, genre, question_type, reasoning_step)
- UserProfileSchema         // User settings and preferences
```

### 4. **Supabase Tables to Query:**
```sql
- user_analytics            // For daily practice stats, streaks
- user_proficiency_signals  // For high-level recommendations (What To Do Next widget)
- user_metric_proficiency   // For detailed skill breakdown (all other widgets)
- user_profiles             // For user settings
```

---

## 🎨 UI DESIGN REQUIREMENTS

### Layout: Bento Grid (from `dashboard_ui.md`)
Use a responsive Bento Grid layout inspired by the dashboard_ui.md reference:
```tsx
// Grid structure example
<div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
  {/* Widget 1: md:col-span-2 md:row-span-2 (Tall) */}
  {/* Widget 2: md:col-span-2 (Standard) */}
  {/* Widget 3: md:col-span-2 md:row-span-2 (Tall) */}
  {/* Widget 4: md:col-span-3 (Wide) */}
  {/* Widget 5: md:col-span-3 (Wide) */}
</div>
```

### Styling
- **Tailwind CSS v4** with dark/light theme support via `ThemeContext`
- Color classes: `bg-bg-primary-{dark/light}`, `text-text-primary-{dark/light}`, `border-border-{dark/light}`
- Framer Motion for animations (`motion.div`, `whileHover`, `initial/animate`)
- Cards with hover effects: `hover:border-zinc-700`, `hover:scale-1.02`
- Icons from `react-icons` or `lucide-react`

### Animations
- Stagger entrance animations: `transition={{ delay: index * 0.1 }}`
- Hover interactions: scale, background color changes
- Loading states with pulse animations

---

## 📊 FIVE WIDGETS TO IMPLEMENT

### **Widget 1: Skill Radar Chart**
**Purpose:** Visualize user's core_skill metrics in a radar/spider chart

**Data Source:**
- Query `user_metric_proficiency` table
- Filter: `dimension_type = 'core_metric'`
- Metrics to display: Extract all core_metric dimension_keys (e.g., "inference", "tone_analysis", "main_idea", "detail_comprehension")

**Rendering:**
```typescript
// Pseudo-structure
{
  dimension_key: "inference",
  proficiency_score: 75,  // 0-100
  confidence_score: 0.8,  // 0-1
  trend: "improving"      // improving | declining | stagnant
}
```

**Implementation Notes:**
- Use a radar chart library like `recharts` or build custom SVG
- Show proficiency_score on each axis
- Color code by trend (green=improving, red=declining, gray=stagnant)
- Display confidence_score as opacity or secondary indicator

---

### **Widget 2: Genre Heatmap**
**Purpose:** Show performance across different content genres (Politics, Science, Economics, etc.)

**Data Source:**
- Query `user_metric_proficiency` table
- Filter: `dimension_type = 'genre'`
- Each genre has: proficiency_score, total_attempts, correct_attempts

**Rendering:**
```typescript
// Example data structure
{
  dimension_key: "Politics",
  proficiency_score: 82,
  total_attempts: 15,
  correct_attempts: 12,
  trend: "improving"
}
```

**Implementation Notes:**
- Grid of genre cards with color intensity based on proficiency_score
- Heatmap colors: Low (red) → Medium (yellow) → High (green)
- Show percentage accuracy on hover
- Sort by proficiency or alphabetically

---

### **Widget 3: Logic Gap Panel (Error Pattern Trends)**
**Purpose:** Identify common reasoning failures and error patterns

**Data Source:**
- Query `user_metric_proficiency` table
- Filter: `dimension_type = 'reasoning_step'` OR `dimension_type = 'error_pattern'`
- Show bottom 3-5 reasoning steps by proficiency_score

**Rendering:**
```typescript
// Example weak reasoning steps
[
  { dimension_key: "causal_reasoning", proficiency_score: 45, total_attempts: 8 },
  { dimension_key: "assumption_identification", proficiency_score: 52, total_attempts: 6 },
  { dimension_key: "argument_structure", proficiency_score: 58, total_attempts: 10 }
]
```

**Implementation Notes:**
- List format with progress bars showing proficiency
- Highlight weak areas (< 60 proficiency_score) in red/orange
- Show trend arrows (↑ improving, ↓ declining, → stagnant)
- Link to practice recommendations

**Note about Error Patterns:**
- The backend analytics currently focuses on `reasoning_step` dimension_type
- If `error_pattern` data is not available, fall back to showing weak reasoning_steps
- Future enhancement: Phase C diagnostics stores error patterns in `practice_sessions.analytics.diagnostics`

---

### **Widget 4: WPM vs Accuracy Chart**
**Purpose:** Visualize speed-accuracy tradeoff across recent practice sessions

**Data Source:**
- Query `user_analytics` table (for daily aggregated stats)
- Calculate WPM from session data: `(questions_attempted * avg_words_per_question) / minutes_practiced`
- Use `accuracy_percentage` directly

**Rendering:**
```typescript
// Pseudo-structure (last 7-30 days)
[
  { date: "2024-01-08", wpm: 220, accuracy: 78 },
  { date: "2024-01-09", wpm: 235, accuracy: 72 },
  { date: "2024-01-10", wpm: 210, accuracy: 85 }
]
```

**Implementation Notes:**
- Scatter plot or dual-axis line chart (WPM + Accuracy over time)
- Use `recharts` library: `<ComposedChart>` with `<Line>` for both metrics
- Highlight optimal zone (high accuracy + good speed)
- Show trend lines

**Fallback for Derived Stats:**
- If WPM data not directly available, calculate from `time_spent_seconds` in `practice_sessions` joined with question count
- Formula: `WPM = (total_words_read / (time_spent_seconds / 60))`

---

### **Widget 5: What To Do Next (Recommendation Engine)**
**Purpose:** AI-powered personalized practice recommendations

**Data Source:**
- Query `user_proficiency_signals` table (single row per user)
- Fields to use:
  - `weak_topics` (array of genre names)
  - `weak_question_types` (array of question types)
  - `recommended_difficulty` (easy/medium/hard)

**Rendering:**
```typescript
// Example data
{
  weak_topics: ["Economics", "Science"],
  weak_question_types: ["inference", "tone"],
  recommended_difficulty: "medium"
}
```

**Implementation Notes:**
- Card with actionable recommendations
- "Focus on: Economics & Science passages"
- "Practice: Inference and Tone questions"
- "Recommended level: Medium difficulty"
- Action button: "Start Recommended Practice" → routes to `/daily`
- Use icons for visual hierarchy

---

## 🏗️ FILE STRUCTURE TO CREATE

```
apps/web/src/pages/dashboard/
├── redux_usecases/
│   └── dashboardApi.ts              # RTK Query API for dashboard
├── components/
│   ├── DashboardSkeleton.tsx        # Loading skeleton component
│   ├── SkillRadarWidget.tsx         # Widget 1
│   ├── GenreHeatmapWidget.tsx       # Widget 2
│   ├── LogicGapWidget.tsx           # Widget 3
│   ├── WPMAccuracyWidget.tsx        # Widget 4
│   └── RecommendationWidget.tsx     # Widget 5
├── utils/
│   └── chartHelpers.ts              # Helper functions for data transformation
├── page/
│   └── DashboardPage.tsx            # Main dashboard page component
└── index.ts                          # Barrel export
```

---

## 📝 IMPLEMENTATION GUIDE

### Step 1: Create the RTK Query API

**File:** `apps/web/src/pages/dashboard/redux_usecases/dashboardApi.ts`

```typescript
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type {
  UserAnalytics,
  UserProficiencySignals,
  UserMetricProficiency,
  UUID
} from "../../../types";

interface DashboardData {
  analytics: UserAnalytics[];
  proficiencySignals: UserProficiencySignals | null;
  metricProficiency: UserMetricProficiency[];
}

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Dashboard", "Analytics", "Proficiency"],
  endpoints: (builder) => ({
    fetchDashboardData: builder.query<DashboardData, UUID>({
      queryFn: async (userId) => {
        try {
          // Fetch user analytics (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: analytics, error: analyticsError } = await supabase
            .from("user_analytics")
            .select("*")
            .eq("user_id", userId)
            .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
            .order("date", { ascending: true });

          if (analyticsError) {
            return { error: { status: "CUSTOM_ERROR", data: analyticsError.message } };
          }

          // Fetch proficiency signals
          const { data: proficiencySignals, error: signalsError } = await supabase
            .from("user_proficiency_signals")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (signalsError) {
            return { error: { status: "CUSTOM_ERROR", data: signalsError.message } };
          }

          // Fetch all metric proficiency data
          const { data: metricProficiency, error: metricError } = await supabase
            .from("user_metric_proficiency")
            .select("*")
            .eq("user_id", userId);

          if (metricError) {
            return { error: { status: "CUSTOM_ERROR", data: metricError.message } };
          }

          return {
            data: {
              analytics: analytics || [],
              proficiencySignals,
              metricProficiency: metricProficiency || [],
            },
          };
        } catch (error) {
          const e = error as { message?: string };
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: e.message || "Error fetching dashboard data",
            },
          };
        }
      },
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useFetchDashboardDataQuery } = dashboardApi;
```

### Step 2: Register API in Store

**File:** `apps/web/src/store/index.ts`

Add to your existing store configuration:
```typescript
import { dashboardApi } from "../pages/dashboard/redux_usecases/dashboardApi";

export const store = configureStore({
  reducer: {
    // ... existing reducers
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // ... existing middleware
      dashboardApi.middleware
    ),
});
```

### Step 3: Create Skeleton Component

**File:** `apps/web/src/pages/dashboard/components/DashboardSkeleton.tsx`

```typescript
import React from "react";

const SkeletonRect: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <SkeletonRect className="h-10 w-64 mb-2" />
        <SkeletonRect className="h-5 w-96" />
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
        {/* Widget 1: Tall */}
        <SkeletonRect className="md:col-span-2 md:row-span-2" />
        
        {/* Widget 2: Standard */}
        <SkeletonRect className="md:col-span-2" />
        
        {/* Widget 3: Tall */}
        <SkeletonRect className="md:col-span-2 md:row-span-2" />
        
        {/* Widget 4: Wide */}
        <SkeletonRect className="md:col-span-3" />
        
        {/* Widget 5: Wide */}
        <SkeletonRect className="md:col-span-3" />
      </div>
    </div>
  );
};
```

### Step 4: Create Main Dashboard Page

**File:** `apps/web/src/pages/dashboard/page/DashboardPage.tsx`

```typescript
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { useFetchDashboardDataQuery } from "../redux_usecases/dashboardApi";
import { supabase } from "../../../services/apiClient";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { SkillRadarWidget } from "../components/SkillRadarWidget";
import { GenreHeatmapWidget } from "../components/GenreHeatmapWidget";
import { LogicGapWidget } from "../components/LogicGapWidget";
import { WPMAccuracyWidget } from "../components/WPMAccuracyWidget";
import { RecommendationWidget } from "../components/RecommendationWidget";

const DashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const [userId, setUserId] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const { data, isLoading, error } = useFetchDashboardDataQuery(userId!, {
    skip: !userId,
  });

  // Show skeleton while loading OR while userId is being fetched
  if (!userId || isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
        <FloatingThemeToggle />
        <FloatingNavigation />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-red-500">Error loading dashboard</h2>
          <p className="text-text-secondary-dark mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Extract data
  const { metricProficiency, proficiencySignals, analytics } = data;

  // Group proficiency by dimension_type for easy widget consumption
  const coreMetrics = metricProficiency.filter(m => m.dimension_type === "core_metric");
  const genres = metricProficiency.filter(m => m.dimension_type === "genre");
  const reasoningSteps = metricProficiency.filter(m => m.dimension_type === "reasoning_step");

  return (
    <div className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
      <FloatingThemeToggle />
      <FloatingNavigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`font-serif font-bold text-4xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
            Your Analytics Dashboard
          </h1>
          <p className={`text-lg mt-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
            Track your progress and identify areas for improvement
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          <SkillRadarWidget data={coreMetrics} isDark={isDark} />
          <GenreHeatmapWidget data={genres} isDark={isDark} />
          <LogicGapWidget data={reasoningSteps} isDark={isDark} />
          <WPMAccuracyWidget data={analytics} isDark={isDark} />
          <RecommendationWidget data={proficiencySignals} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```

### Step 5: Create Widget Components

Each widget should:
1. Accept `data` and `isDark` props
2. Use `motion.div` with stagger animations
3. Apply Tailwind classes for theme support
4. Handle empty data gracefully
5. Use Framer Motion for hover effects

**Example Widget Structure:**

```typescript
import React from "react";
import { motion } from "framer-motion";
import type { UserMetricProficiency } from "../../../types";

interface SkillRadarWidgetProps {
  data: UserMetricProficiency[];
  isDark: boolean;
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({ data, isDark }) => {
  return (
    <motion.div
      className={`md:col-span-2 md:row-span-2 rounded-xl p-6 border ${
        isDark
          ? "bg-bg-secondary-dark border-border-dark"
          : "bg-bg-secondary-light border-border-light"
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className={`font-serif text-xl font-bold mb-4 ${
        isDark ? "text-text-primary-dark" : "text-text-primary-light"
      }`}>
        Skill Radar
      </h3>
      
      {/* Render radar chart or message */}
      {data.length === 0 ? (
        <p className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
          No skill data available yet. Complete practice sessions to see your skill breakdown.
        </p>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {/* TODO: Implement radar chart using recharts or custom SVG */}
          <div>Radar Chart Placeholder</div>
        </div>
      )}
    </motion.div>
  );
};
```

---

## 🎨 STYLING CONVENTIONS (from quick_start.md)

### Color Classes
```typescript
// Background colors
isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"

// Text colors
isDark ? "text-text-primary-dark" : "text-text-primary-light"
isDark ? "text-text-secondary-dark" : "text-text-secondary-light"

// Border colors
isDark ? "border-border-dark" : "border-border-light"

// Brand colors
isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
```

### Motion Variants
```typescript
// Fade in from top
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}

// Fade in from bottom with stagger
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1 }}

// Hover scale
whileHover={{ scale: 1.02 }}
```

---

## 🔧 UTILITIES AND HELPERS

### Chart Data Transformation

**File:** `apps/web/src/pages/dashboard/utils/chartHelpers.ts`

```typescript
import type { UserMetricProficiency, UserAnalytics } from "../../../types";

export function transformRadarData(metrics: UserMetricProficiency[]) {
  return metrics.map(m => ({
    skill: m.dimension_key,
    score: m.proficiency_score,
    confidence: m.confidence_score,
    trend: m.trend,
  }));
}

export function transformHeatmapData(genres: UserMetricProficiency[]) {
  return genres.map(g => ({
    genre: g.dimension_key,
    score: g.proficiency_score,
    attempts: g.total_attempts,
    accuracy: (g.correct_attempts / g.total_attempts) * 100,
  }));
}

export function calculateWPMData(analytics: UserAnalytics[]) {
  // Assume avg 300 words per question
  const AVG_WORDS_PER_QUESTION = 300;
  
  return analytics.map(a => ({
    date: a.date,
    wpm: a.minutes_practiced > 0 
      ? (a.questions_attempted * AVG_WORDS_PER_QUESTION) / a.minutes_practiced
      : 0,
    accuracy: a.accuracy_percentage || 0,
  }));
}
```

---

## ✅ CHECKLIST BEFORE COMPLETION

- [ ] RTK Query API created and registered in store
- [ ] DashboardSkeleton component shows immediately on load
- [ ] All 5 widgets implemented as separate components
- [ ] Theme support (dark/light) implemented correctly
- [ ] Framer Motion animations added with stagger effects
- [ ] Empty states handled (no data scenarios)
- [ ] Error states handled gracefully
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Proper TypeScript types used throughout
- [ ] Logging patterns followed (emoji prefixes)
- [ ] No console warnings or errors
- [ ] Code follows existing patterns from `daily` folder
- [ ] All imports use correct paths
- [ ] Components exported via index.ts

---

## 📚 REFERENCE FILES TO STUDY

Before implementation, study these files:
1. `apps/web/src/pages/daily/redux_usecase/dailyPracticeApi.ts` - RTK Query pattern
2. `apps/web/src/pages/daily/components/DailySkeleton.tsx` - Skeleton pattern
3. `apps/web/src/pages/daily/page/DailyPage.tsx` - Page structure
4. `apps/web/src/types/index.ts` - Schema definitions
5. `services/workers/analytics/phases/phaseE_rollupSignals.ts` - Data structure reference

---

## 🚀 EXECUTION ORDER

1. Create `dashboardApi.ts` with RTK Query endpoints
2. Register API in store
3. Create `DashboardSkeleton.tsx`
4. Create `DashboardPage.tsx` with basic structure
5. Implement each widget component one by one:
   - Start with simplest (RecommendationWidget)
   - Then GenreHeatmapWidget and LogicGapWidget
   - Then SkillRadarWidget and WPMAccuracyWidget (may need chart libraries)
6. Create `chartHelpers.ts` utility functions
7. Test with real data
8. Polish animations and styling
9. Handle edge cases (no data, errors)
10. Create barrel exports in `index.ts`

---

## 📦 DEPENDENCIES

No new dependencies should be needed! The project already has:
- ✅ Framer Motion
- ✅ React Icons
- ✅ Tailwind CSS v4
- ✅ Redux Toolkit + RTK Query
- ✅ React Router v7

**Optional (if charts needed):**
- Consider `recharts` for radar/line charts: `npm install recharts`
- Or build custom SVG charts using native React

---

## 🎯 SUCCESS CRITERIA

The implementation is complete when:
1. Dashboard loads instantly with skeleton UI
2. Data fetches in background via RTK Query
3. Widgets appear progressively as data loads
4. All 5 widgets render correctly with actual data
5. Theme switching works seamlessly
6. Animations are smooth and professional
7. Empty states and errors handled gracefully
8. Code follows project conventions 100%
9. No Redux slice created (API-only approach)
10. TypeScript has no errors

---

## 💡 TIPS FOR THE AI AGENT

- **Follow the existing patterns EXACTLY** - don't invent new patterns
- **Static rendering is KEY** - skeleton should appear instantly
- **Use Supabase client correctly** - await results, check for errors
- **Theme support everywhere** - use the isDark pattern consistently
- **Animations enhance UX** - but don't overdo it
- **Handle edge cases** - empty data, loading, errors
- **Type safety** - use Zod schemas from types/index.ts
- **Console logs** - use emoji prefixes like in analytics worker
- **Responsive design** - test grid on mobile/tablet/desktop breakpoints
- **Performance** - fetch data once, cache via RTK Query

---

**END OF PROMPT**

This prompt provides complete context and step-by-step guidance. Follow it precisely and you'll have a production-ready dashboard that matches the codebase standards perfectly!
