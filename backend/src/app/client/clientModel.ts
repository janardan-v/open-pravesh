import z from "zod";

export const clientRegisterSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  redirectUri: z.string().min(1, "Redirect URI is required"),
  hostedUri: z.string().optional().default(""),
});

export type clientRegisterData = z.infer<typeof clientRegisterSchema>;

export const clientLoginSchema = z.object({  
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type clientLoginData = z.infer<typeof clientLoginSchema>;

export const createAppSchema = z.object({
  clientName: z.string().min(1, "Application name is required"),
  redirectUri: z.string().min(1, "Redirect URI is required"),
  hostedUri: z.string().optional().default(""),
});

export type CreateAppData = z.infer<typeof createAppSchema>;
