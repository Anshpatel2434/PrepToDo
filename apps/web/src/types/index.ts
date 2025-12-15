import {z} from 'zod'

//Defining the zod schema
export const UserSchema = z.object({
    id: z.uuid(),
    email: z.email().min(1, "Email cannot be empty!"),
    confirmationToken: z.string()
})

//Infering the typescript types from schema
export type UserItem = z.infer<typeof UserSchema>