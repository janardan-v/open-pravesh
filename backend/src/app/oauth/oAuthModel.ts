import z from "zod"

export const authenticateUserSchema = z.object({
    clientId : z.string(),
})

export type authenticateUserData = z.infer<typeof authenticateUserSchema>