import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

export async function validateRequest<T>(
    req: NextRequest,
    schema: ZodSchema<T>
) {
    const body = await req.json();
    const parsedbBody = schema.safeParse(body);

    if (!parsedbBody.success) {
        return {
            error: NextResponse.json(
                { error: parsedbBody.error.issues[0].message },
                { status: 400 }
            ),
            data: null
        }
    }

    return {
        data: parsedbBody.data,
        error: null
    };
}