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
        }
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return user;
}