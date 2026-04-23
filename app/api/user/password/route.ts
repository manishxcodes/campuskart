import { ApiHandler } from "@/lib/api/api-handler";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setPasswordApiSchema, updatePasswordApiSchema } from "@/types/schema/profile";
import { ErrorResponse, SuccessResponse } from "@/lib/api/api-response";
import { NextRequest } from "next/server";


export const POST = ApiHandler(async (req: NextRequest) => {
    const session = await auth();
    const userId = session?.user?.id;

    if(!userId) return ErrorResponse("Unauthorized", 401);

    const body = await req.json();

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (!currentUser) return ErrorResponse("User not found", 404);
    
    const isPasswordSet = Boolean(currentUser.password);
    
    if (isPasswordSet) {
        const parsed = updatePasswordApiSchema.safeParse(body);
        if (!parsed.success) return ErrorResponse(parsed.error.issues[0].message, 400);

        const { currentPassword, newPassword } = parsed.data;

        const isPasswordMatched = await bcrypt.compare(currentPassword, currentUser.password!);
        
        if(!isPasswordMatched) return ErrorResponse("Invalid Password", 400);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword},
        });
        
        return SuccessResponse("Password changed Successfully", null);
    } else {
        const parsed = setPasswordApiSchema.safeParse(body);
        if (!parsed.success) return ErrorResponse(parsed.error.issues[0].message, 400);

        const { password } = parsed.data;

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return SuccessResponse("Password set Successfully", null);
    }
});