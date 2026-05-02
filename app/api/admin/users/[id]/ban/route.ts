import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { requireAdmin } from "@/lib/api/admin";
import { banUser } from "@/app/services/admin.service";
import { banUserSchema } from "@/types/schema/admin";
import { NextRequest } from "next/server";

export const PATCH = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = banUserSchema.safeParse(body);
    if (!parsed.success) {
      return ErrorResponse(parsed.error.issues[0].message, 400);
    }

    const user = await banUser(id, parsed.data.isBanned);

    return SuccessResponse(
      parsed.data.isBanned ? "User banned" : "User unbanned",
      { user }
    );
  }
);
