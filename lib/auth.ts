import NextAuth from "next-auth";
import { prisma } from "./prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authConfig } from "./auth.config";
import { email } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    providers: [
        ...authConfig.providers!,
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                        include: { accounts: true },
                    });

                    if (user && !user.password) {
                        const hasGoogleAccount = user.accounts.some(
                            (acc) => acc.provider === "google"
                        );
                        if (hasGoogleAccount) return null;
                    }

                    if (!user || !user.password) return null;

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isPasswordValid) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null;
                }
            },
        }),
    ],

    pages: {
        signIn: "/signin",
        error: "/signin",
    },

    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === "google") {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                        include: { accounts: true },
                    });

                    // Case 1: New Google user — create manually
                    if (!existingUser) {
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: profile?.name ?? user.email!.split("@")[0],
                                image: user.image ?? null,
                            },
                        });

                        await prisma.account.create({
                            data: {
                                userId: newUser.id,
                                type: "oauth",
                                provider: "google",
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token ?? null,
                                expires_at: account.expires_at ?? null,
                                token_type: account.token_type ?? null,
                                scope: account.scope ?? null,
                                id_token: account.id_token ?? null,
                            },
                        });

                        user.id = newUser.id;
                        return true;
                    }

                    // Case 2: Existing credentials user — link Google
                    const alreadyLinked = existingUser.accounts.some(
                        (acc) => acc.provider === "google"
                    );

                    if (!alreadyLinked) {
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: "oauth",
                                provider: "google",
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token ?? null,
                                expires_at: account.expires_at ?? null,
                                token_type: account.token_type ?? null,
                                scope: account.scope ?? null,
                                id_token: account.id_token ?? null,
                            },
                        });

                        if (!existingUser.image && user.image) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { image: user.image },
                            });
                        }
                    }

                    user.id = existingUser.id;
                }

                return true;
            } catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },

        async jwt({ token, user, trigger, session }) {
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: {email: user.email!},
                });

                token.id = dbUser?.id;
                token.isProfileComplete = dbUser?.isProfileCompleted;
                token.picture = dbUser?.image;
                token.name = dbUser?.name;
            }
            if (trigger === "update" && session) {
                token.name = session.user?.name;
                token.picture = session.user?.image;
            }
            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.isProfileCompleted = token.isProfileCompleted as boolean;
                session.user.name = token?.name as string;
                session.user.image = token?.picture as string;
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (url.startsWith(baseUrl)) return url;
            return `${baseUrl}/`;
        },
    },

    events: {
        async signIn({ user, isNewUser }) {
            if (isNewUser) console.log(`New user signed up: ${user.email}`);
        },
    },
});