import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Войдите в свой аккаунт
                    </p>
                </div>
                <div className="h-64 animate-pulse rounded-md bg-muted" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}