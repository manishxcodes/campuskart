import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }),
    ],
    pages: {
        signIn: "/signin"
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
        const isLoggedIn = !!auth?.user;
        const isAuthPage = nextUrl.pathname.startsWith("/signin");
        const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

        if (isApiAuth) return true;
        if (isLoggedIn && isAuthPage) return Response.redirect(new URL("/", nextUrl));
        if (!isLoggedIn && !isAuthPage) return false;
        return true;
    },
  },
};