import { ErrorResponse } from "./api-response";

export function ApiHandler (handler: Function) {
    return async (req: Request) => {
        try {
            return await handler(req);
        } catch (error) {
            console.error("API error: ", error);

            ErrorResponse("Something went wrong. Please try again", 500);
        }
    }
} 