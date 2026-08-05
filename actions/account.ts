"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export type AccountState = {
    error?: string;
    success?: boolean;
};

export async function updateProfile(
    _prevState: AccountState,
    formData: FormData
): Promise<AccountState> {
    console.log("=== updateProfile called ===");

    const session = await auth();
    console.log("session.user:", session?.user);

    if (!session?.user?.id) {
        console.log("No session or no user.id");
        return { error: "Unauthorized" };
    }

    const name = (formData.get("name") as string)?.trim();
    const imageRaw = formData.get("image") as string | null;
    const image = imageRaw?.trim() || null;

    console.log("received name:", name);
    console.log("received image:", image);

    if (!name || name.length < 2) {
        return { error: "Имя должно содержать минимум 2 символа" };
    }

    if (name.length > 80) {
        return { error: "Имя слишком длинное" };
    }

    try {
        const result = await db
            .update(users)
            .set({
                name,
                image,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id))
            .returning({
                id: users.id,
                name: users.name,
                image: users.image,
            });

        console.log("update result:", result);

        if (!result.length) {
            return { error: "Пользователь не найден" };
        }

        revalidatePath("/account");
        revalidatePath("/admin");
        revalidatePath("/provider");
        revalidatePath("/customer");

        return { success: true };
    } catch (err) {
        console.error("updateProfile error:", err);
        return { error: "Не удалось сохранить изменения" };
    }
}