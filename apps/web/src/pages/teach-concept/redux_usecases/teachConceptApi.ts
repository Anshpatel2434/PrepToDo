import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { supabase } from "../../../services/apiClient"

// Types for the concept teaching feature
export interface ConceptTeachingRequest {
    conceptQuery?: string;
}

export interface ConceptTeachingResponse {
    explanation?: string;
}


export const conceptTeachingApi = createApi({
    reducerPath: "conceptTeachingApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["ConceptTeaching"],
    endpoints: (builder) => ({
        //Teach a concept using AI system
        teachConcept: builder.mutation<ConceptTeachingResponse, ConceptTeachingRequest>({
            queryFn: async ({ conceptQuery }) => {
                try {

                    const { data, error } = await supabase.functions.invoke("teach-concept", {
                        body: { conceptQuery: conceptQuery }
                    })



                    if (error)
                        return { error: { status: "CUSTOM_ERROR", data: error.message } }

                    // ✅ FIX: Wrap the response in a 'data' property
                    return {
                        data: {
                            explanation: data,
                            // Note: 'success' is not in your ConceptTeachingResponse interface. 
                            // If you need it, add it to the interface, otherwise remove it here.
                        }
                    }
                } catch (err) {
                    console.log("OOOOOPPPSS error")
                    console.log(err)
                    const error = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: error.message || "Failed to get response",
                        },
                    };
                }
            },
        })
    })
})

export const {
    //function queries
    useTeachConceptMutation
} = conceptTeachingApi