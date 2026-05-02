import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { requireAdmin } from "@/lib/api/admin";
import { banProduct } from "@/app/services/admin.service";
import { banProductSchema } from "@/types/schema/admin";
import { NextRequest } from "next/server";

export const PATCH = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = banProductSchema.safeParse(body);
    if (!parsed.success) {
      return ErrorResponse(parsed.error.issues[0].message, 400);
    }

    const product = await banProduct(id, parsed.data.isBanned);

    return SuccessResponse(
      parsed.data.isBanned ? "Product banned" : "Product unbanned",
      { product }
    );
  }
);
