import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/types/schema/auth";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ApiHandler } from "@/lib/api-handler";
import { validateRequest } from "@/lib/validate";
import { ErrorResponse, SuccessResponse } from "@/lib/api-response";

export const POST = ApiHandler (async (req: NextRequest) => {
    const { data, error } = await validateRequest(req, signupSchema);

    if (error) return ErrorResponse(error, 400);

    const { name, email, password } = data;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    if(existingUser) return ErrorResponse("An accoount with this email already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        select: {
            id: true, 
            name: true, 
            email: true,
            isProfileCompleted: true
        }
    });

    return SuccessResponse("Signup Successfull", newUser, 201);
})