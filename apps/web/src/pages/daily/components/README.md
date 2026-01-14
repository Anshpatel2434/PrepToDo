# Daily Page Components

This directory contains reusable components for the daily practice page.

## PreviousTestsContainer

A pagination-based container for displaying and navigating through previous daily tests.

### Features

- **Pagination**: Displays 20 tests per page with Previous/Next navigation
- **Rectangular Strip Layout**: Tests are displayed as long rectangular strips stacked vertically
- **Click-to-Select**: Clicking on a test selects it and updates the URL
- **Today's Test Indicator**: Highlights today's test with a special border and "TODAY" badge
- **Selected State**: Visually indicates the currently selected test
- **Loading State**: Shows a loading spinner while fetching data
- **Empty State**: Displays a friendly message when no previous tests are available

### Props

- `onExamSelect: (examId: string) => void` - Callback function when a test is selected
- `selectedExamId: string | null` - The ID of the currently selected exam
- `todayExamId: string | null` - The ID of today's exam (for highlighting)

### Usage Example

```tsx
import PreviousTestsContainer from "../components/PreviousTestsContainer";

function MyPage() {
  const handleExamSelect = (examId: string) => {
    navigate(`/daily?exam_id=${examId}`);
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

## Future Components

Feel free to add more components here as needed to keep the codebase organized and maintainable.
