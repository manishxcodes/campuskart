import { ApiHandler } from "@/lib/api/api-handler";
import { SuccessResponse } from "@/lib/api/api-response";
import { requireAdmin } from "@/lib/api/admin";
import { getAllUsers } from "@/app/services/admin.service";
import { NextRequest } from "next/server";

export const GET = ApiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const users = await getAllUsers();

  return SuccessResponse("Users fetched", { users });
});
