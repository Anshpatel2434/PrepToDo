// dashboardSlice.ts
import { createSlice, createSelector, type PayloadAction } from "@reduxjs/toolkit";

// Dashboard state interfaces
interface DashboardState {
    // UI state
    isLoading: boolean;
    error: string | null;
    
    // Selected data ranges
    analyticsDaysRange: number;
    selectedGenre: string | null;
    
    // Collapsible widget states
    widgetStates: Record<string, boolean>;
}

const initialState: DashboardState = {
    isLoading: false,
    error: null,
    analyticsDaysRange: 84, // 12 weeks default
    selectedGenre: null,
    widgetStates: {
        skillRadar: true,
        genreHeatmap: true,
        logicGapPanel: true,
        wpmAccuracy: true,
        whatToDoNext: true,
    },
};

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        // Loading state management
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        
        clearError: (state) => {
            state.error = null;
        },
        
        // Data range management
        setAnalyticsDaysRange: (state, action: PayloadAction<number>) => {
            state.analyticsDaysRange = action.payload;
        },
        
        // Genre selection
        setSelectedGenre: (state, action: PayloadAction<string | null>) => {
            state.selectedGenre = action.payload;
        },
        
        // Widget visibility management
        toggleWidget: (state, action: PayloadAction<string>) => {
            const widgetId = action.payload;
            if (widgetId in state.widgetStates) {
                state.widgetStates[widgetId] = !state.widgetStates[widgetId];
            }
        },
        
        setWidgetState: (state, action: PayloadAction<{ widgetId: string; isOpen: boolean }>) => {
            const { widgetId, isOpen } = action.payload;
            if (widgetId in state.widgetStates) {
                state.widgetStates[widgetId] = isOpen;
            }
        },
        
        // Reset dashboard state
        resetDashboard: () => initialState,
    },
});

// Selectors
export const selectDashboardState = (state: { dashboard: DashboardState }) => state.dashboard;
export const selectIsLoading = createSelector(
    selectDashboardState,
    (s) => s.isLoading
);
export const selectError = createSelector(
    selectDashboardState,
    (s) => s.error
);
export const selectAnalyticsDaysRange = createSelector(
    selectDashboardState,
    (s) => s.analyticsDaysRange
);
export const selectSelectedGenre = createSelector(
    selectDashboardState,
    (s) => s.selectedGenre
);
export const selectWidgetStates = createSelector(
    selectDashboardState,
    (s) => s.widgetStates
);
export const selectWidgetState = (widgetId: string) => 
    createSelector(selectWidgetStates, (states) => states[widgetId] ?? true);

// Export actions
export const {
    setLoading,
    setError,
    clearError,
    setAnalyticsDaysRange,
    setSelectedGenre,
    toggleWidget,
    setWidgetState,
    resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
