import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse, ErrorResponse } from "@/lib/api/api-response";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/services/notification.service";
import { NextRequest } from "next/server";

// GET /api/notifications — list notifications
export const GET = ApiHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

  const notifications = await getNotifications(session.user.id);
  return SuccessResponse("Notifications fetched", { notifications });
});

// PATCH /api/notifications — mark as read
export const PATCH = ApiHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return ErrorResponse("Unauthorized", 401);

  const { notificationId, markAll } = await req.json();

  if (markAll) {
    await markAllNotificationsAsRead(session.user.id);
    return SuccessResponse("All notifications marked as read", {});
  }

  if (notificationId) {
    await markNotificationAsRead(notificationId, session.user.id);
    return SuccessResponse("Notification marked as read", {});
  }

  return ErrorResponse("notificationId or markAll is required", 400);
});
