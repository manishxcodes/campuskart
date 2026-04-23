import { z } from "zod";

export const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    whatsappNumber: z.string().optional().nullable(),
    isWhatsappPublic: z.boolean().optional(),
    imageUrl: z.string().optional().nullable()
});

// for frontend
export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters long"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// for backend
export const updatePasswordApiSchema = z.object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters long"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
}).refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password cannot be same as current password",
    path: ["newPassword"],
});


// for frontend
export const setPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// for backend
export const setPasswordApiSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
});


export type ProfileFormValues = z.infer<typeof profileSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;