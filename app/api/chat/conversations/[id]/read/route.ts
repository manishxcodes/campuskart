import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { markMessagesAsRead } from "@/app/services/chat.service";
import { NextRequest } from "next/server";

// POST /api/chat/conversations/[id]/read — mark messages as read
export const POST = ApiHandler(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

    const { id } = await params;
    await markMessagesAsRead(id, session.user.id);

    return SuccessResponse("Messages marked as read", {});
  }
);
