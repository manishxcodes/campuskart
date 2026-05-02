import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { requireAdmin } from "@/lib/api/admin";
import { deleteProduct } from "@/app/services/admin.service";
import { NextRequest } from "next/server";

export const DELETE = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await params;

    await deleteProduct(id);

    return SuccessResponse("Product deleted", null);
  }
);
