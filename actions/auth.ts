"use server";

import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { signIn, signOut } from "@/lib/auth";

export type AuthState = {
    error?: string;
    success?: boolean;
};

async function logVerificationLink(email: string, url: string) {
    const logDir = path.join(process.cwd(), "logs");
    await mkdir(logDir, { recursive: true });
    const logFile = path.join(logDir, "verification.log");
    const line = `[${new Date().toISOString()}] ${email}\n${url}\n\n`;
    await appendFile(logFile, line, "utf8");
    console.log("\n🔗 Verification link (also in logs/verification.log):\n", url, "\n");
}

export async function register(
    _prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Заполните все поля" };
    }

    if (password.length < 6) {
        return { error: "Пароль должен быть не менее 6 символов" };
    }

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existing) {
        return { error: "Пользователь с таким email уже существует" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "customer",
        // emailVerified остаётся null
    });

    // Создаём токен верификации (24 часа)
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
        identifier: email,
        token,
        expires,
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await logVerificationLink(email, verifyUrl);

    // Не логиним автоматически — сначала нужно подтвердить email
    redirect("/login?registered=1");
}

export async function login(
    _prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Заполните все поля" };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        return { error: "Неверный email или пароль" };
    }

    if (!user.emailVerified) {
        return {
            error: "Email не подтверждён. Откройте logs/verification.log, скопируйте ссылку и перейдите по ней в браузере.",
        };
    }

    try {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            return { error: "Неверный email или пароль" };
        }
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Неверный email или пароль" };
        }
        throw error;
    }

    // Редирект по роли
    const dest =
        user.role === "admin"
            ? "/admin"
            : user.role === "provider"
                ? "/provider"
                : "/customer";

    redirect(dest);
}

export async function logout() {
    await signOut({ redirectTo: "/login" });
}