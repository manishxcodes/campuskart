import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import { getUnreadNotificationCount } from "@/app/services/notification.service";

// GET /api/notifications/unread-count
export const GET = ApiHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

  const count = await getUnreadNotificationCount(session.user.id);
  return SuccessResponse("Unread count fetched", { count });
});
