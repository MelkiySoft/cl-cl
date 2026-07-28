"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
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
        role: "customer", // по умолчанию
    });

    // Сразу логиним после регистрации
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/",
        });
    } catch {
        // signIn бросает NEXT_REDIRECT — это нормально
    }

    return { success: true };
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
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/",
        });
    } catch (error) {
        // Auth.js бросает ошибку при неверных данных
        return { error: "Неверный email или пароль" };
    }

    return { success: true };
}