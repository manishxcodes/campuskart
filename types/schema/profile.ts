import { z } from "zod";

export const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    whatsappNumber: z.string().optional().nullable(),
    isWhatsappPublic: z.boolean().optional(),
    imageUrl: z.string().optional().nullable()
});
