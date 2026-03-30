import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be atleast 3 character"),
    email: z.email("Invalid email address"),
    password: z
    .string()
    .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits")
    .optional(),
    whatsappNumber: z.string().length(10).optional(),
    isWhatsappPublic: z.boolean().optional()
});

export const signinSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be atleast 8 characters")
});



