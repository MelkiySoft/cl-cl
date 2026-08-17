// actions/upload.ts
"use server";

import { auth } from "@/lib/auth";
import {
    getUploadUrl,
    makeKey,
    getPublicUrl,
    getPrivateUploadUrl,
    makeDocumentKey,
} from "@/lib/r2";
import type { DocumentType } from "@/db/schema";

type CreateUploadUrlInput = {
    filename: string;
    contentType: string;
    folder: "companies" | "categories" | "users";
    entityId?: string | number;
};
export async function createUploadUrl(
    input: CreateUploadUrlInput
){
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


type CreateDocumentUploadUrlInput = {
    filename: string;
    contentType: string;
    companyId: number;
    type: DocumentType;
};

const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

export async function createDocumentUploadUrl(
    input: CreateDocumentUploadUrlInput
) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" as const };
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(input.contentType)) {
        return { error: "Unsupported file type" as const };
    }

    // Проверяем, что компания принадлежит текущему пользователю
    // (или пользователь — admin)
    const { db } = await import("@/db");
    const { companies } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const company = await db.query.companies.findFirst({
        where:
            session.user.role === "admin"
                ? eq(companies.id, input.companyId)
                : and(
                    eq(companies.id, input.companyId),
                    eq(companies.userId, session.user.id)
                ),
        columns: { id: true },
    });

    if (!company) {
        return { error: "Company not found" as const };
    }

    const key = makeDocumentKey(input.companyId, input.type, input.filename);
    const uploadUrl = await getPrivateUploadUrl(key, input.contentType, 60 * 5);

    return {
        uploadUrl,
        key,
    };
}