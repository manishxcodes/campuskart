import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { requireAuth } from "@/lib/api/admin";
import {
  getProductById,
  updateProduct,
  softDeleteProduct,
} from "@/app/services/product.service";
import { updateProductApiSchema } from "@/types/schema/product";
import { NextRequest } from "next/server";

export const GET = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const product = await getProductById(id);

    return SuccessResponse("Product fetched", { product });
  }
);

export const PATCH = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateProductApiSchema.safeParse(body);
    if (!parsed.success) {
      return ErrorResponse(parsed.error.issues[0].message, 400);
    }

    const product = await updateProduct(id, parsed.data, session.user.id);

    return SuccessResponse("Product updated", { product });
  }
);

export const DELETE = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await requireAuth();
    const { id } = await params;

    await softDeleteProduct(id, session.user.id);

    return SuccessResponse("Product deleted", null);
  }
);
