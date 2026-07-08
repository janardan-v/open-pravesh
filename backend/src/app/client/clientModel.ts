import z, { email } from "zod";

export const clientRegisterSchema = z.object({
  clientName: z.string(),
  email: z.email(),
  password: z.string(),
  redirectUri: z.string(),
  hostedUri: z.string(),
});


export type clientRegisterData = z.infer<typeof clientRegisterSchema>

export const clientLoginSchema = z.object({  
  email: z.email(),
  password: z.string(),
});


export type clientLoginData = z.infer<typeof clientLoginSchema>

