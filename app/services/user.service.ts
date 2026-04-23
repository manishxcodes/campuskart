import { ApiError } from "@/lib/api/api-error";
import { prisma } from "@/lib/prisma";

export async function getUserById (userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            whatsappNumber: true,
            isWhatsappPublic: true,
            password: true,
            isProfileCompleted: true,
        }
    });

    if (!user) throw new ApiError("User not found", 404);

    const { password, ...rest } = user;
    const isPasswordSet = Boolean(password);

    const userData = { ...rest, isPasswordSet}
   
    return userData;
}