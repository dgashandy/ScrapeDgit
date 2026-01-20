import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import { verifyPassword } from "./password";
import { AuthProvider } from "@prisma/client";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase() },
                });

                if (!user || !user.passwordHash) {
                    throw new Error("Invalid email or password");
                }

                const isValid = await verifyPassword(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.avatarUrl,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email?.toLowerCase();
                if (!email) return false;

                // Check if user exists
                let dbUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (!dbUser) {
                    // Create new user for Google OAuth
                    dbUser = await prisma.user.create({
                        data: {
                            email,
                            name: user.name,
                            avatarUrl: user.image,
                            authProvider: AuthProvider.GOOGLE,
                            isVerified: true,
                        },
                    });
                }

                return true;
            }

            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email?.toLowerCase() },
                });

                if (dbUser) {
                    token.userId = dbUser.id;
                    token.role = dbUser.role;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id: string }).id = token.userId as string;
                (session.user as { role: string }).role = token.role as string;
            }

            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
