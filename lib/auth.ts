import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { NextAuthConfig }  from "next-auth";
import { prisma } from "./prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from 'bcrypt';


export const authConfig: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email"},
                password: { label: "Password", type: "password"},
            },
            async authorize (credentials) {
                if(!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string
                    }
                });

                if(!user || !user.password) {
                    throw new Error("No account found with this email");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if(!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    }, 
    pages: {
        signIn: "/signin",
        error: "/sigin"
    },
    callbacks: {
        async jwt ({ token, user, trigger, session }) {
            if(user) {
                token.id = user.id
            }

            if(trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session ({ session, token }) {
            if(token && session.user) {
                session.user.id = token.id as string;
            }

            return session;
        },
        async redirect ({ url, baseUrl }) {
            if(url.startsWith("/")) return `${baseUrl}${url}`;
            if(url.startsWith(baseUrl)) return url;

            return `${baseUrl}/`
        },
    }, events: {
        async signIn({ user, isNewUser }) {
            if(isNewUser) {
                console.log(`New user signed up: ${user.email}`);
            }
        }
    }
}

export const { handlers,  auth, signIn, signOut } = NextAuth(authConfig);