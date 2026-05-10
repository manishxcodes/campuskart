import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/api-error";

export async function getOrCreateConversation(
  productId: string,
  buyerId: string,
  sellerId: string
) {
  if (buyerId === sellerId) {
    throw new ApiError("You cannot chat with yourself", 400);
  }

  // Check product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, userId: true },
  });

  if (!product) throw new ApiError("Product not found", 404);
  if (product.userId !== sellerId)
    throw new ApiError("Invalid seller for this product", 400);

  // Find existing or create
  const existing = await prisma.conversation.findUnique({
    where: {
      productId_buyerId: { productId, buyerId },
    },
    include: {
      product: {
        select: { id: true, title: true, images: true, sellingPrice: true },
      },
      buyer: { select: { id: true, name: true, image: true, email: true } },
      seller: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      productId,
      buyerId,
      sellerId,
    },
    include: {
      product: {
        select: { id: true, title: true, images: true, sellingPrice: true },
      },
      buyer: { select: { id: true, name: true, image: true, email: true } },
      seller: { select: { id: true, name: true, image: true, email: true } },
    },
  });
}

export async function getConversationsByUserId(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      product: {
        select: { id: true, title: true, images: true, sellingPrice: true },
      },
      buyer: { select: { id: true, name: true, image: true, email: true } },
      seller: { select: { id: true, name: true, image: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          isRead: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations;
}

export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit = 50
) {
  // Verify user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });

  if (!conversation) throw new ApiError("Conversation not found", 404);
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new ApiError("Not authorized to view this conversation", 403);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: items.reverse(), // Return in chronological order
    hasMore,
    nextCursor: hasMore ? items[0].id : null,
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  // Verify sender is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      sellerId: true,
      product: { select: { title: true } },
    },
  });

  if (!conversation) throw new ApiError("Conversation not found", 404);
  if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
    throw new ApiError("Not authorized to send messages here", 403);
  }

  // Determine recipient
  const recipientId =
    conversation.buyerId === senderId
      ? conversation.sellerId
      : conversation.buyerId;

  // Create message and update conversation timestamp
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Create notification for recipient
  const senderUser = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });

  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `New message from ${senderUser?.name || "Someone"}`,
      body:
        content.length > 100 ? content.substring(0, 100) + "..." : content,
      link: `/chats?conversation=${conversationId}`,
    },
  });

  return { message, recipientId };
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  // Mark all messages NOT sent by this user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });
}
