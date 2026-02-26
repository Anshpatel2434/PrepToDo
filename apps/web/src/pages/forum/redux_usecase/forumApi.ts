// =============================================================================
// Forum API — RTK Query (matches dashboardApi / dailyPracticeApi pattern)
// =============================================================================
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// =============================================================================
// Types (inline, following project convention)
// =============================================================================
export interface ForumPost {
    id: string;
    content: string;
    mood: string | null;
    answer_summary: string | null;
    tags: string[] | null;
    target_query: string | null;
    likes: number;
    dislikes: number;
    post_type: string | null;
    created_at: string;
    thread_id: string;
    thread_slug?: string;
    thread_title?: string;
    thread_category?: string;
}

export interface ForumThread {
    id: string;
    title: string;
    slug: string;
    category: string | null;
    seo_description: string | null;
    schema_type: string | null;
    created_at: string;
    posts: ForumPost[];
}

interface ForumFeedData {
    posts: ForumPost[];
}

interface ForumThreadData {
    thread: ForumThread;
}

interface ForumSchemaData {
    schema: Record<string, unknown>;
}

interface ReactionResult {
    action: "added" | "removed" | "switched";
    reaction: "like" | "dislike";
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}

// =============================================================================
// Backend API Configuration
// =============================================================================
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// =============================================================================
// Forum RTK Query API
// =============================================================================
export const forumApi = createApi({
    reducerPath: "forumApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/persona-forum`,
        credentials: "include",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("preptodo_access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["ForumFeed", "ForumThread"],
    endpoints: (builder) => ({
        // GET /feed — Latest forum posts
        fetchForumFeed: builder.query<ForumFeedData, void>({
            query: () => "/feed",
            transformResponse: (response: ApiResponse<ForumFeedData>) => {
                if (!response.success) {
                    throw new Error(
                        response.error?.message || "Failed to fetch forum feed"
                    );
                }
                return response.data;
            },
            providesTags: ["ForumFeed"],
        }),

        // GET /thread/:slug — Thread with all posts
        fetchForumThread: builder.query<ForumThreadData, string>({
            query: (slug) => `/thread/${slug}`,
            transformResponse: (response: ApiResponse<ForumThreadData>) => {
                if (!response.success) {
                    throw new Error(
                        response.error?.message || "Failed to fetch thread"
                    );
                }
                return response.data;
            },
            providesTags: ["ForumThread"],
        }),

        // GET /thread/:slug/schema — JSON-LD structured data
        fetchThreadSchema: builder.query<ForumSchemaData, string>({
            query: (slug) => `/thread/${slug}/schema`,
            transformResponse: (response: ApiResponse<ForumSchemaData>) => {
                if (!response.success) {
                    throw new Error(
                        response.error?.message || "Failed to fetch schema"
                    );
                }
                return response.data;
            },
        }),

        // POST /post/:id/react — Like or dislike a post
        reactToPost: builder.mutation<
            ReactionResult,
            { postId: string; reaction: "like" | "dislike" }
        >({
            query: ({ postId, reaction }) => ({
                url: `/post/${postId}/react`,
                method: "POST",
                body: { reaction },
            }),
            transformResponse: (response: ApiResponse<ReactionResult>) => {
                if (!response.success) {
                    throw new Error(
                        response.error?.message || "Failed to react"
                    );
                }
                return response.data;
            },
            invalidatesTags: ["ForumFeed", "ForumThread"],
        }),
    }),
});

export const {
    useFetchForumFeedQuery,
    useFetchForumThreadQuery,
    useFetchThreadSchemaQuery,
    useReactToPostMutation,
} = forumApi;
