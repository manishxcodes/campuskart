import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            isProfileCompleted: boolean;
            isAdmin: boolean;
        } & DefaultSession["user"];
    }
}