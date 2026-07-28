"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/lib/auth";

export type AuthState = {
    error?: string;
    success?: boolean;
};

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
    });

    // Логиним без автоматического редиректа от signIn
    const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
    });

    if (result?.error) {
        return { error: "Аккаунт создан, но войти не удалось. Попробуйте войти вручную." };
    }

    redirect("/");
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

    redirect("/");
}