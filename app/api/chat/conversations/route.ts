import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import {
  getOrCreateConversation,
  getConversationsByUserId,
} from "@/app/services/chat.service";
import { NextRequest } from "next/server";

// GET /api/chat/conversations — list all conversations for the logged-in user
export const GET = ApiHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

  const conversations = await getConversationsByUserId(session.user.id);
  return SuccessResponse("Conversations fetched", { conversations });
});

// POST /api/chat/conversations — create or get existing conversation
export const POST = ApiHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

  const { productId, sellerId } = await req.json();

  if (!productId || !sellerId) {
    return ErrorResponse("productId and sellerId are required", 400);
  }

  const conversation = await getOrCreateConversation(
    productId,
    session.user.id,
    sellerId
  );

  return SuccessResponse("Conversation ready", { conversation });
});
