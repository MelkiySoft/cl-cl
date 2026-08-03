// actions/upload.ts
"use server";

import { auth } from "@/lib/auth";
import { getUploadUrl, makeKey, getPublicUrl } from "@/lib/r2";

type CreateUploadUrlInput = {
    filename: string;
    contentType: string;
    folder: "companies" | "categories" | "users";
    entityId?: string | number;
};

export async function createUploadUrl(input: CreateUploadUrlInput) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" as const };
    }

    const allowed = ["image/jpeg", "image/png", "image/webp" ]; // "image/svg+xml"
    if (!allowed.includes(input.contentType)) {
        return { error: "Unsupported file type" as const };
    }

    // Ограничение размера можно добавить позже (через Content-Length в presigned)

    const key = makeKey(input.folder, input.filename, input.entityId);
    const uploadUrl = await getUploadUrl(key, input.contentType, 60 * 5); // 5 мин

    return {
        uploadUrl,
        key,
        publicUrl: getPublicUrl(key),
    };
}