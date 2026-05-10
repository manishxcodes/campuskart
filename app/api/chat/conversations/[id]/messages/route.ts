import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { getMessages, sendMessage } from "@/app/services/chat.service";
import { pusherServer } from "@/lib/pusher";
import { NextRequest } from "next/server";

// GET /api/chat/conversations/[id]/messages
export const GET = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    const result = await getMessages(id, session.user.id, cursor);
    return SuccessResponse("Messages fetched", result);
  }
);

// POST /api/chat/conversations/[id]/messages — send a message
export const POST = ApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

    const { id } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return ErrorResponse("Message content is required", 400);
    }

    const { message, recipientId } = await sendMessage(
      id,
      session.user.id,
      content.trim()
    );

    // Trigger real-time event to conversation channel
    await pusherServer.trigger(`conversation-${id}`, "new-message", message);

    // Trigger notification event to recipient
    await pusherServer.trigger(`user-${recipientId}`, "new-notification", {
      conversationId: id,
      message,
    });

    return SuccessResponse("Message sent", { message });
  }
);
