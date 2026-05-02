import { ApiError } from "@/lib/api/api-error";
import { prisma } from "@/lib/prisma";

export async function getWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  // Verify product exists and is visible
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new ApiError("Product not found", 404);
  if (product.isDeleted || product.isBanned)
    throw new ApiError("Product is not available", 400);
  if (product.userId === userId)
    throw new ApiError("Cannot wishlist your own product", 400);

  // Check if already wishlisted
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) throw new ApiError("Product already in wishlist", 409);

  return prisma.wishlist.create({
    data: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (!existing) throw new ApiError("Product not in wishlist", 404);

  return prisma.wishlist.delete({
    where: {
      userId_productId: { userId, productId },
    },
  });
}

export async function isProductWishlisted(
  userId: string,
  productId: string
): Promise<boolean> {
  const item = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
  return !!item;
}

export async function getUserWishlistProductIds(
  userId: string
): Promise<string[]> {
  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  });
  return wishlists.map((w) => w.productId);
}
