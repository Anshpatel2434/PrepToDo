import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface DictionaryWord {
    id: string;
    word_id: string;
    word: string;
    pronunciation?: string;
    meanings: Array<{ meaning: string; example: string }>;
    origin?: string;
    relate_with?: string;
    mnemonic?: string;
    breakdown?: string;
    synonyms?: string[];
    antonyms?: string[];
    source_context?: string;
    source_passage_id?: string;
    created_at: string;
}

export interface LookupWordRequest {
    word: string;
    passage_id?: string;
    source_context?: string;
    check_only?: boolean;
}

export interface LookupWordResponse {
    word_data?: {
        word: string;
        pronunciation?: string;
        meanings: Array<{ meaning: string; example: string }>;
        mnemonic?: string;
    };
    cached?: boolean;
    limit_reached?: boolean;
    message?: string;
    not_found?: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
}

export const dictionaryApi = createApi({
    reducerPath: "dictionaryApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/dictionary`,
        credentials: 'include',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('preptodo_access_token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Dictionary"],
    endpoints: (builder) => ({
        getDictionary: builder.query<DictionaryWord[], { search?: string; sort?: string; order?: string } | void>({
            query: (params) => ({
                url: "/",
                params: params || undefined,
            }),
            transformResponse: (response: ApiResponse<DictionaryWord[]>) => {
                if (!response.success) throw new Error(response.error?.message || 'Failed to load dictionary');
                return response.data;
            },
            providesTags: ["Dictionary"],
        }),
        lookupWord: builder.mutation<LookupWordResponse, LookupWordRequest>({
            query: (body) => ({
                url: "/lookup",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<LookupWordResponse>) => {
                if (!response.success) throw new Error(response.error?.message || 'Failed to lookup word');
                return response.data;
            },
            invalidatesTags: ["Dictionary"],
        }),
        removeWord: builder.mutation<{ success: boolean }, string>({
            query: (wordId) => ({
                url: `/${wordId}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<{ success: boolean }>) => {
                if (!response.success) throw new Error(response.error?.message || 'Failed to remove word');
                return response.data;
            },
            invalidatesTags: ["Dictionary"],
        }),
    }),
});

export const {
    useGetDictionaryQuery,
    useLookupWordMutation,
    useRemoveWordMutation,
} = dictionaryApi;
