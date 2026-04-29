import { z } from "zod";

// Max 256KB per image (base64 encoded)
const MAX_IMAGE_SIZE_BYTES = 256 * 1024;

function isBase64WithinSize(val: string, maxBytes: number): boolean {
  // base64 data URLs: "data:image/...;base64,<data>"
  const base64Data = val.split(",")[1];
  if (!base64Data) return false;
  // Each base64 character represents 6 bits → 4 chars ≈ 3 bytes
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  return sizeInBytes <= maxBytes;
}

// ── Frontend schemas ──

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description is required"),
  condition: z.string().min(10, "Condition is required"),
  originalPrice: z.number().min(0, "Original price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
}).refine((data) => data.sellingPrice <= data.originalPrice, {
  message: "Selling price must be less than or equal to original price",
  path: ["sellingPrice"],
});

export const updateProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  condition: z
    .string()
    .min(10, "Condition is required")
    .max(1000, "Condition must be at most 1000 characters")
    .optional(),
  sellingPrice: z
    .number().min(0)
    .positive("Selling price must be positive")
    .max(1000000, "Selling price too high")
    .optional(),
  originalPrice: z
    .number().min(0)
    .positive("Original price must be positive")
    .max(1000000, "Original price too high")
    .optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  images: z
    .array(z.string())
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed")
    .optional(),
}).refine((data) => data.sellingPrice! <= data.originalPrice!, {
  message: "Selling price must be less than or equal to original price",
  path: ["sellingPrice"],
});

// // ── Backend (API) schemas ──

export const createProductApiSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
  condition:z.string().min(10, "Condition is required"),
  sellingPrice: z
    .coerce.number()
    .positive("Price must be positive")
    .max(1000000, "Price too high"),
  originalPrice: z
    .coerce.number()
    .positive("Price must be positive")
    .max(1000000, "Price too high"),  
  categoryId: z.string().min(1, "Category is required"),
  images: z
    .array(
      z.string().refine(
        (val) => {
          // Allow existing Cloudinary URLs through
          if (val.startsWith("http")) return true;
          // Validate base64 size
          return isBase64WithinSize(val, MAX_IMAGE_SIZE_BYTES);
        },
        { message: "Each image must be ≤ 256 KB" }
      )
    )
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed"),
});

export const updateProductApiSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  condition: z
    .string()
    .min(10, "Condition is required")
    .max(1000, "Condition must be at most 1000 characters")
    .optional(),
  sellingPrice: z
    .coerce.number()
    .min(0, "Selling price must be 0 or more")
    .max(1000000, "Selling price too high")
    .optional(),
  originalPrice: z
    .coerce.number()
    .min(0, "Original price must be 0 or more")  
    .max(1000000, "Original price too high")
    .optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  images: z
    .array(
      z.string().refine(
        (val) => {
          if (val.startsWith("http")) return true;
          return isBase64WithinSize(val, MAX_IMAGE_SIZE_BYTES);
        },
        { message: "Each image must be ≤ 256 KB" }
      )
    )
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed")
    .optional(),
});

// ── Type exports ──

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
export type CreateProductApiValues = z.infer<typeof createProductApiSchema>;
export type UpdateProductApiValues = z.infer<typeof updateProductApiSchema>;
