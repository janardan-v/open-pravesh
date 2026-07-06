
import * as z from "zod";
 
export const registerSchema = z.object({
  name: z.string(),
  email: z.email("Invalid Email"),
  password: z.string(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().optional()
});

export type RegisterData = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email(),
  password: z.string()
});

export type LoginData = z.infer<typeof loginSchema>

