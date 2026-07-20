import z from "zod"

export const authenticateUserSchema = z.object({
    clientId : z.string(),
    userId: z.string(),
    userEmail: z.email(),
    

})

export type authenticateUserData = z.infer<typeof authenticateUserSchema>