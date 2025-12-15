import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { authApi } from "../pages/auth/redux_usecases/authApi";

export const store = configureStore({
    reducer: {
        // Auth API for backend communication and state management
        [authApi.reducerPath]: authApi.reducer,
    },
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of RTK Query
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
        .concat(authApi.middleware)
})

//optional, but required for refetchOnFocus/refetchOnReconnect behaviours
setupListeners(store.dispatch)

//Infer the 'RootState' and 'AppDispatch' types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;