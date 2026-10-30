import * as z from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string().optional(),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
