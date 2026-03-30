import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth ((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;

    const isAuthPage = nextUrl.pathname.startsWith("/signin") || nextUrl.pathname.startsWith("/signup") ;
    const isPublicRoute = nextUrl.pathname === "/";
    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

    if (isApiAuthRoute) return;

    if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/home", nextUrl));
    }

    if(!isLoggedIn && !isAuthPage && !isPublicRoute) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname);
        return Response.redirect(
            new URL(`/signin?callbackUrl=${callbackUrl}`, nextUrl)
        );
    }

    return ;
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};