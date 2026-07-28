import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";

type Props = {
    searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { token, email } = await searchParams;

    if (!token || !email) {
        redirect("/login?error=invalid_token");
    }

    const record = await db.query.verificationTokens.findFirst({
        where: and(
            eq(verificationTokens.identifier, email),
            eq(verificationTokens.token, token)
        ),
    });

    if (!record || record.expires < new Date()) {
        // Можно удалить просроченный токен, но не обязательно
        redirect("/login?error=expired_or_invalid");
    }

    // Подтверждаем email
    await db
        .update(users)
        .set({
            emailVerified: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(users.email, email));

    // Удаляем использованный токен
    await db
        .delete(verificationTokens)
        .where(
            and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, token)
            )
        );

    redirect("/login?verified=1");
}