import { NextResponse } from "next/server";

export function SuccessResponse (
    message: string,
    data: any,
    status = 200
) {
    return NextResponse.json(
        { message, data},
        { status }
    );
}

export function ErrorResponse (
    message: any,
    status = 200
) {
    return NextResponse.json(
        message,
        { status }
    );
}