import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { getCategories } from "@/app/services/category.service";
import { NextRequest } from "next/server";

export const GET = ApiHandler(async (req: NextRequest) => {
  const categories = await getCategories();
  return SuccessResponse("Categories fetched", { categories });
});
