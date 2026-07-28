"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/actions/auth";

const initialState: AuthState = {};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, initialState);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Регистрация</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Создайте аккаунт
                </p>
            </div>

            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Имя
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Иван"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                        Пароль
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>

                {state?.error && (
                    <p className="text-sm text-red-500">{state.error}</p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-md bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                    {isPending ? "Регистрация..." : "Зарегистрироваться"}
                </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="underline underline-offset-4">
                    Войти
                </Link>
            </p>
        </div>
    );
}