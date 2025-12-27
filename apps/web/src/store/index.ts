import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { authApi } from "../pages/auth/redux_usecases/authApi";
import authReducer from "../pages/auth/redux_usecases/authSlice";
import { conceptTeachingApi } from "../pages/teach-concept/redux_usecases/teachConceptApi";
import dailyPracticeReducer from "../pages/daily/redux_usecase/dailyPracticeSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // Auth API for backend communication and state management
        [authApi.reducerPath]: authApi.reducer,

        //Teaching concept api just for trial purpose
        [conceptTeachingApi.reducerPath]: conceptTeachingApi.reducer,

        // Daily Practice state
        dailyPractice: dailyPracticeReducer,
    },
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of RTK Query
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, conceptTeachingApi.middleware),
});

//optional, but required for refetchOnFocus/refetchOnReconnect behaviours
setupListeners(store.dispatch);

//Infer the 'RootState' and 'AppDispatch' types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
