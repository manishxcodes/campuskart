import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { requireAuth } from "@/lib/api/admin";
import { getProducts, createProduct } from "@/app/services/product.service";
import { createProductApiSchema } from "@/types/schema/product";
import { NextRequest } from "next/server";

export const GET = ApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "12");
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category") || undefined;

  const result = await getProducts({ cursor, limit, search, categoryId });

  return SuccessResponse("Products fetched", result);
});

export const POST = ApiHandler(async (req: NextRequest) => {
  const session = await requireAuth();

  const body = await req.json();
  const parsed = createProductApiSchema.safeParse(body);
  if (!parsed.success) {
    return ErrorResponse(parsed.error.issues[0].message, 400);
  }

  const product = await createProduct(parsed.data, session.user.id);

  return SuccessResponse("Product created", { product }, 201);
});
