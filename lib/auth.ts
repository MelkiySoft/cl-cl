import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import {
    users,
    accounts,
    sessions,
    verificationTokens,
    type UserRole,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),

    session: {
        strategy: "jwt", // важно: с Credentials надёжнее JWT, чем database
    },

    pages: {
        signIn: "/login",
        // newUser: "/register", // можно добавить позже
    },

    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    return null;
                }

                // Требуем подтверждённый email
                if (!user.emailVerified) {
                    return null;
                }

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role as UserRole,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // При логине
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name;
                token.picture = user.image; // next-auth использует picture
            }

            // При вызове update() с клиента
            if (trigger === "update" && session) {
                if (session.name !== undefined) token.name = session.name;
                if (session.image !== undefined) token.picture = session.image;
                // можно добавить и другие поля при необходимости
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.name = token.name as string | null | undefined;
                session.user.image = token.picture as string | null | undefined;
            }
            return session;
        },
    },

});