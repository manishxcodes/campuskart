import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./api-error";
import { ErrorResponse } from "./api-response";

export function ApiHandler(
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
        try {
            return await handler(req, context);
        } catch (error: any) {
            console.log("API error", error);

            if (error instanceof ApiError) {
                return ErrorResponse(error.message, error.statusCode);
            }

            return ErrorResponse("Something went wrong", 500);
        }
    }
}