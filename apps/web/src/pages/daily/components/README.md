# Daily Page Components

This directory contains reusable components for the daily practice page.

## PreviousTestsContainer

A pagination-based container for displaying and navigating through previous daily tests.

### Features

- **Pagination**: Displays 20 tests per page with Previous/Next navigation
- **Rectangular Strip Layout**: Tests are displayed as long rectangular strips stacked vertically
- **Click-to-Select**: Clicking on a test selects it and triggers a page refresh with updated URL
- **Today's Test Indicator**: Highlights today's test with a special border and "TODAY" badge
- **Selected State**: Visually indicates the currently selected test
- **Loading State**: Shows a loading spinner while fetching data
- **Empty State**: Displays a friendly message when no previous tests are available
- **Toast Notification**: Shows a toast when a previous test is selected

### Props

- `onExamSelect: (examId: string, examDate: string) => void` - Callback function when a test is selected (includes exam ID and formatted date)
- `selectedExamId: string | null` - The ID of the currently selected exam
- `todayExamId: string | null` - The ID of today's exam (for highlighting)

### Usage Example

```tsx
import PreviousTestsContainer from "../components/PreviousTestsContainer";
import toast from "react-hot-toast";

function MyPage() {
  const handleExamSelect = (examId: string, examDate: string) => {
    // Force page refresh to ensure proper rendering
    window.location.href = `/daily?exam_id=${examId}`;

    // Show toast notification for previous tests
    if (!isTodayExam({ id: examId } as Exam)) {
      toast.success(`Viewing daily test from ${examDate}`);
    }
  };

  return (
    <PreviousTestsContainer
      onExamSelect={handleExamSelect}
      selectedExamId={selectedExamId}
      todayExamId={todayData?.examInfo?.id || null}
    />
  );
}
```

### Design Decisions

1. **Separate Component**: Created as a standalone component to keep the main DailyPage clean and focused
2. **Pagination Limit**: Fixed at 20 items per page as per requirements
3. **Strip Layout**: Uses full-width rectangular strips instead of cards for better readability and mobile experience
4. **Always Visible**: The container is always displayed even if there's no test for today, allowing users to practice with previous tests

### Styling

- Uses Tailwind CSS with theme-aware classes (dark/light mode)
- Framer Motion for smooth animations
- Consistent with the overall design system using:
  - `bg-bg-secondary-dark/light` for backgrounds
  - `border-border-dark/light` for borders
  - `text-text-primary-dark/light` for primary text
  - `text-text-secondary-dark/light` for secondary text
  - `brand-primary-dark/light` for brand colors
  - `amber-500` for today's test highlights

## ArticleInfoPanel

A collapsible panel that displays information about source articles used to generate the test content.

### Features

- **Collapsible Design**: Starts expanded but can be collapsed via header click to save screen space
- **Article Metadata Display**: Shows title, source, author, publication date, genre, and topic tags
- **External Links**: Provides links to read the original articles
- **Loading State**: Shows loading indicator while articles are being fetched
- **Responsive Layout**: Gracefully adapts to mobile screens with responsive grid layouts
- **Empty State Handling**: Component returns null if no articles are available
- **Smooth Animations**: Uses Framer Motion for expand/collapse transitions

### Props

- `articles: Article[]` - Array of article objects to display
- `isLoading?: boolean` - Optional loading state indicator

### Usage Example

```tsx
import ArticleInfoPanel from "../components/ArticleInfoPanel";
import { useFetchArticlesByIdsQuery } from "../redux_usecase/dailyPracticeApi";

function MyPage() {
  const selectedExam = getSelectedExamInfo();
  const articleIds = selectedExam?.used_articles_id || [];
  
  const { data: articles = [], isLoading: isLoadingArticles } = useFetchArticlesByIdsQuery(
    { article_ids: articleIds },
    { skip: articleIds.length === 0 }
  );

  return (
    <ArticleInfoPanel
      articles={articles}
      isLoading={isLoadingArticles}
    />
  );
}
```

### Design Decisions

1. **Collapsible by Default**: Starts expanded to help users mentally prepare, but can be collapsed to reduce distraction
2. **Visually Distinct**: Uses subtle backgrounds and borders to stand out without being overwhelming
3. **Information Architecture**: Organized with most important info (title) first, followed by metadata in a grid
4. **Responsive Grid**: Metadata uses a 1-2 column responsive grid that adapts to screen size
5. **External Links**: Opens original articles in new tab for reference

### UX Expectations

- **Visually Distinct**: Uses bordered card with icon header to stand out from other content
- **Not Distracting**: Subtle colors and optional collapse functionality prevent overwhelming the user
- **Mental Preparation**: Provides context about source material to help users prepare for the test
- **Mobile Friendly**: Collapses gracefully on small screens with responsive layouts and truncated text

### Styling

- Consistent with the design system using theme-aware Tailwind classes
- Framer Motion for smooth expand/collapse animations
- Responsive grid layouts for different screen sizes
- Icon integration from react-icons/md

## Future Components

Feel free to add more components here as needed to keep the codebase organized and maintainable.
