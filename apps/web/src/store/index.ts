// import { configureStore } from "@reduxjs/toolkit";
// import { setupListeners } from "@reduxjs/toolkit/query/react";

// export const store = configureStore({
//     reducer: {
//         // Add the generated reducer as a specific top-level slice
//        example [vocabApi.reducerPath]: vocabApi.reducer,
//     },
//     // Adding the api middleware enables caching, invalidation, polling,
//     // and other useful features of RTK Query
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware()
//     .concat(vocabApi.middleware) example
// })

// //optional, but required for refetchOnFocus/refetchOnReconnect behaviours
// setupListeners(store.dispatch)

// //Infer the 'RootState' and 'AppDispatch' types from the store itself
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;