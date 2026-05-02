import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { requireAuth } from "@/lib/api/admin";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/app/services/wishlist.service";
import { NextRequest } from "next/server";

export const POST = ApiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
  ) => {
    const session = await requireAuth();
    const { productId } = await params;

    const wishlist = await addToWishlist(session.user.id, productId);

    return SuccessResponse("Added to wishlist", { wishlist }, 201);
  }
);

export const DELETE = ApiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
  ) => {
    const session = await requireAuth();
    const { productId } = await params;

    await removeFromWishlist(session.user.id, productId);

    return SuccessResponse("Removed from wishlist", null);
  }
);
