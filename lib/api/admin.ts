import { auth } from "@/lib/auth";
import { ApiError } from "./api-error";


export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }

  if (!session.user.isAdmin) {
    throw new ApiError("Forbidden: Admin access required", 403);
  }

  return session;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }

  return session;
}
