import { z } from "zod";

export const wishlistParamsSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type WishlistParamsValues = z.infer<typeof wishlistParamsSchema>;
