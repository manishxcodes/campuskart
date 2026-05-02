import { z } from "zod";

export const banUserSchema = z.object({
  isBanned: z.boolean(),
});

export const banProductSchema = z.object({
  isBanned: z.boolean(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
});

export type BanUserValues = z.infer<typeof banUserSchema>;
export type BanProductValues = z.infer<typeof banProductSchema>;
