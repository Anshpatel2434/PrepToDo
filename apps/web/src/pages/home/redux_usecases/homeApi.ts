// example code 

// import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
// import { supabase } from "../../../services/apiClient";
// import { VocabSchema, type VocabItem } from "../../../types";

// export const vocabApi = createApi({
//     reducerPath: 'vocabApi',
//     //We use fakeBaseQuery because Supabse's client handles the actual fetching
//     baseQuery: fakeBaseQuery(),
//     endpoints: (builder) => ({
//         // Endpoint 1 : Get all vocab words
//         getVocab: builder.query<VocabItem[], void>({
//             queryFn: async () => {
//                 const{data, error} = await supabase
//                 .from('vocab')
//                 .select("*");

//                 if (error){
//                     return {error: {status: "CUSTOM_ERROR", data: error.message}}
//                 }

//                 //Optional : Validate data with zod (good for type safety !)
//                 //this ensures the data form DB matches exactly what our app expects
//                 try{
//                     const parsedData = data.map((item) => VocabSchema.parse(item));
//                     return {data : parsedData};
//                 }
//                 catch(validationError){
//                     return {error: {status: "PARSING_ERROR", data: validationError}}
//                 }
//             }
//         })
//     })
// })

// //Auto-generated hook for usage in components
// export const { useGetVocabQuery } = vocabApi