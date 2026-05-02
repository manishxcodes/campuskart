import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { requireAdmin } from "@/lib/api/admin";
import { NextRequest } from "next/server";
import { getAllProducts } from "@/app/services/admin.service";

export const GET = ApiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const products = await getAllProducts();

  return SuccessResponse("Products fetched", { products });
});
