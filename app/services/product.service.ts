import { ApiError } from "@/lib/api/api-error";
import { prisma } from "@/lib/prisma";
import { uploadProductImage, deleteImageFromCloudinary } from "@/lib/cloudinary";
import { CreateProductApiValues, UpdateProductApiValues } from "@/types/schema/product";

export async function getProducts({
  cursor,
  limit = 12,
  search,
  categoryId,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  categoryId?: string;
}) {
  const where: any = {
    isDeleted: false,
    isBanned: false,
    user: {
      isBanned: false,
      isDeleted: false,
    },
  };

  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    take: limit + 1, // fetch one extra to determine if there's more
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: "desc" },
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
      _count: {
        select: { wishlists: true },
      },
    },
  });

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    products: items,
    nextCursor,
    hasMore,
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          whatsappNumber: true,
          isWhatsappPublic: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { wishlists: true },
      },
    },
  });

  if (!product) throw new ApiError("Product not found", 404);
  return product;
}

export async function getUserProducts(userId: string) {
  return prisma.product.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { wishlists: true },
      },
    },
  });
}

export async function createProduct(
  data: CreateProductApiValues,
  userId: string
) {
  // Upload images to Cloudinary
  const imageUrls: string[] = [];
  for (const img of data.images) {
    if (img.startsWith("data:")) {
      const uploaded = await uploadProductImage(img);
      imageUrls.push(uploaded.url);
    } else {
      imageUrls.push(img);
    }
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new ApiError("Category not found", 400);

  // calculate discount percentage
  const discountPercentage =
    data.originalPrice > 0
      ? Math.round(
          ((data.originalPrice - data.sellingPrice) / data.originalPrice) * 100
        )
      : 0;    

  return prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      condition: data.condition,
      sellingPrice: data.sellingPrice,
      originalPrice: data.originalPrice,
      discount: discountPercentage,
      images: imageUrls,
      categoryId: data.categoryId,
      userId,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });
}

export async function updateProduct(
  id: string,
  data: UpdateProductApiValues,
  userId: string
) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) throw new ApiError("Product not found", 404);
  if (product.userId !== userId)
    throw new ApiError("Not authorized to edit this product", 403);
  if (product.isDeleted) throw new ApiError("Product has been deleted", 400);

  const updateData: Record<string, any> = {};

  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice ?? product.sellingPrice;
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice ?? product.originalPrice;
  if (data.condition) updateData.condition = data.condition;
  if (data.categoryId) updateData.categoryId = data.categoryId;

   const finalOriginalPrice = updateData.originalPrice ?? product.originalPrice;
  const finalSellingPrice = updateData.sellingPrice ?? product.sellingPrice;

  const discountPercentage =
    finalOriginalPrice > 0
      ? Math.round(((finalOriginalPrice - finalSellingPrice) / finalOriginalPrice) * 100)
    : 0;

  updateData.discount = discountPercentage;

  if (data.images) {
    // Upload new base64 images, keep existing URLs
    const imageUrls: string[] = [];
    for (const img of data.images) {
      if (img.startsWith("data:")) {
        const uploaded = await uploadProductImage(img);
        imageUrls.push(uploaded.url);
      } else {
        imageUrls.push(img);
      }
    }

    // Delete old images that are no longer in the list
    const removedImages = product.images.filter(
      (old) => !imageUrls.includes(old)
    );
    for (const img of removedImages) {
      try {
        await deleteImageFromCloudinary(img);
      } catch (e) {
        console.error("Failed to delete old product image:", e);
      }
    }

    updateData.images = imageUrls;
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function softDeleteProduct(id: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) throw new ApiError("Product not found", 404);
  if (product.userId !== userId)
    throw new ApiError("Not authorized to delete this product", 403);

  return prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });
}
