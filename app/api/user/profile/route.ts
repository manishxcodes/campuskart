import { getUserById } from "@/app/services/user.service";
import { ApiError } from "@/lib/api/api-error";
import { ApiHandler } from "@/lib/api/api-handler";
import { ErrorResponse, SuccessResponse } from "@/lib/api/api-response";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary";
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
    const userId = session?.user?.id;

    if(!userId) return ErrorResponse("Unauthorized", 401);

    const body = await req.json();

    const parsed = profileSchema.safeParse(body);
    if(!parsed.success) return ErrorResponse(parsed.error.issues[0].message, 400);

    const { name, whatsappNumber, isWhatsappPublic, imageUrl } = parsed.data;

    const  currentUser = await getUserById(userId);

    const updateData: Record<string, any> = {};

    if (name) updateData.name = name;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (isWhatsappPublic !== undefined) updateData.isWhatsappPublic = isWhatsappPublic;
    
    if (imageUrl && imageUrl.startsWith("data:")) {
        const uploaded = await uploadImageToCloudinary(imageUrl);

        if (currentUser.image && currentUser.image.includes("cloudinary.com")) {
        await deleteImageFromCloudinary(currentUser.image);
    }

    updateData.image = uploaded.url;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId},
        data: updateData,
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

    return SuccessResponse("Profile updated", {user: updatedUser});
})