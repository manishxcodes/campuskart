import { getUserById } from "@/app/services/user.service";
import { ApiError } from "@/lib/api/api-error";
import { ApiHandler } from "@/lib/api/api-handler";
import { ErrorResponse, SuccessResponse } from "@/lib/api/api-response";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/types/schema/profile";
import { NextRequest } from "next/server";

export const GET = ApiHandler(async(req: Request) => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new ApiError("Unathorized", 401);
    }

    const user = await getUserById(userId);

    return SuccessResponse("Profile fetched", { user });
});

export const PATCH = ApiHandler(async (req: NextRequest) => {
    const session = await auth();
    const userId = session?.user.id;

    if(!userId) return ErrorResponse("Unauthorized", 401);

    const body = await req.json();

    const parsed = profileSchema.safeParse(body);
    if(!parsed.success) return ErrorResponse(parsed.error.issues[0].message, 400);

    const { name, whatsappNumber, isWhatsappPublic, imageUrl } = parsed.data;

    let newImageUrl: string | undefined;

    if (imageUrl && imageUrl.startsWith("data:")) {
        const uploaded = await uploadImageToCloudinary(imageUrl);
        newImageUrl = uploaded.url;
    } 

    const updatedUser = await prisma.user.update({
        where: { id: userId},
        data: {
            ...(name && { name }),
            ...(whatsappNumber !== undefined && { whatsappNumber }),
            isWhatsappPublic: isWhatsappPublic,
            ...(newImageUrl && { imageUrl})
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            whatsappNumber: true,
            isWhatsappPublic: true,
            isProfileCompleted: true,
        }
    })

    return SuccessResponse("Profile updated", updatedUser);
})