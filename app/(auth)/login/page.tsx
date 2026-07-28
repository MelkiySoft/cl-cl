"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type AuthState } from "@/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);
    const searchParams = useSearchParams();

    const registered = searchParams.get("registered");
    const verified = searchParams.get("verified");
    const errorParam = searchParams.get("error");

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Войдите в свой аккаунт
                </p>
            </div>

            {registered && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                    Аккаунт создан. Ссылка для подтверждения email записана в{" "}
                    <code className="font-mono text-xs">logs/verification.log</code>.
                    Откройте файл, скопируйте ссылку и перейдите по ней.
                </div>
            )}

            {verified && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
                    Email успешно подтверждён! Теперь можете войти.
                </div>
            )}

            {errorParam === "invalid_token" && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                    Неверная ссылка подтверждения.
                </div>
            )}

            {errorParam === "expired_or_invalid" && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                    Ссылка устарела или уже использована. Зарегистрируйтесь заново или
                    попросите новую ссылку.
                </div>
            )}

            <form action={formAction} className="space-y-4">
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
                    {isPending ? "Вход..." : "Войти"}
                </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{" "}
                <Link href="/register" className="underline underline-offset-4">
                    Зарегистрироваться
                </Link>
            </p>
        </div>
    );
}