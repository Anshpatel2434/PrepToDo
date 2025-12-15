import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";

//type for the data recieved from the form
interface AuthCredentials{
    email: string,
    password: string
}

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        //endpoint 1: Sign Up (Mutation)
        signUp: builder.mutation<any, AuthCredentials>({
            queryFn: async ({email, password}) => {
                const {data, error} = await supabase.auth.signUp({
                    email, 
                    password
                });
                if(error) return {error : {status: 'CUSTOM_ERROR', data: error.message}}
                return {data}
            }
        }),

        //Endpoint 2: Login (Mutation)
        login: builder.mutation<any, AuthCredentials>({
            queryFn: async({email, password}) => {
                const {data, error} = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) return {error: {status: 'CUSTOM_ERROR', data: error.message}}
                return {data}
            }
        })
    })
})