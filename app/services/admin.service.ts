import { ApiError } from "@/lib/api/api-error";
import { prisma } from "@/lib/prisma";
import { deleteProductImages } from "@/lib/cloudinary";
import { Prisma } from "@prisma/client";

export async function getAllUsers() {
  return prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isBanned: true,
      isDeleted: true,
      createdAt: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function banUser(id: string, isBanned: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError("User not found", 404);
  if (user.isDeleted) throw new ApiError("User has been deleted", 400);

  // Check if user is an admin — can't ban admins
  const isAdmin = await prisma.admin.findUnique({
    where: { email: user.email },
  });
  if (isAdmin) throw new ApiError("Cannot ban an admin user", 400);

  // Use transaction to ban user + auto-ban/unban their products
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: { isBanned },
    });

    // When banning a user, ban all their products
    // When unbanning, unban all their products too
    await tx.product.updateMany({
      where: { userId: id },
      data: { isBanned },
    });

    return updatedUser;
  });
}

export async function softDeleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError("User not found", 404);

  // Check if user is an admin — can't delete admins
  const isAdmin = await prisma.admin.findUnique({
    where: { email: user.email },
  });
  if (isAdmin) throw new ApiError("Cannot delete an admin user", 400);

  return prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    select: {
      id: true,
      title: true,
      sellingPrice: true,
      originalPrice: true,
      discount: true, 
      condition: true,
      description: true,
      images: true,
      isDeleted: true,
      isBanned: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function banProduct(id: string, isBanned: boolean) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError("Product not found", 404);

  return prisma.product.update({
    where: { id },
    data: { isBanned },
  });
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError("Product not found", 404);

  // Delete images from Cloudinary
  if (product.images.length > 0) {
    await deleteProductImages(product.images);
  }

  // Delete all wishlist entries for this product first
  await prisma.wishlist.deleteMany({ where: { productId: id } });

  // Hard delete the product
  return prisma.product.delete({ where: { id } });
}
