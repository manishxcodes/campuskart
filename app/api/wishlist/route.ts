import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { requireAuth } from "@/lib/api/admin";
import { getWishlist } from "@/app/services/wishlist.service";
import { getUserWishlistProductIds } from "@/app/services/wishlist.service";
import { NextRequest } from "next/server";

export const GET = ApiHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const wishlist = await getWishlist(session.user.id);

  return SuccessResponse("Wishlist fetched", { wishlist });
});
