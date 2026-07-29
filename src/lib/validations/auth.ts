import { z } from "zod";

const usernamePattern = /^[a-z0-9_]{3,20}$/;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(usernamePattern, "Use 3-20 letras minúsculas, números ou _"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;
