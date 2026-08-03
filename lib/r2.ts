import "server-only";

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;
const publicUrl = process.env.R2_PUBLIC_URL!; // без слэша в конце

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("Missing R2 environment variables");
}

export const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

/**
 * Генерирует presigned URL для прямой загрузки с клиента (рекомендуемый способ)
 */
export async function getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 60 * 5 // 5 минут
) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(r2, command, { expiresIn });
}

/**
 * Загрузка с сервера (Server Action / Route Handler)
 */
export async function uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string
) {
    await r2.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );

    return getPublicUrl(key);
}

/**
 * Удаление файла
 */
export async function deleteFile(key: string) {
    await r2.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}

/**
 * Публичный URL файла
 */
export function getPublicUrl(key: string) {
    return `${publicUrl}/${key}`;
}

/**
 * Генерация ключа (пути) файла
 * Пример: companies/42/logo-7f3a9c.webp
 */
export function makeKey(
    folder: "companies" | "categories" | "users",
    filename: string,
    id?: string | number
) {
    const uuid = crypto.randomUUID().slice(0, 8);
    const safeName = filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (id !== undefined) {
        return `${folder}/${id}/${uuid}-${safeName}`;
    }

    return `${folder}/${uuid}-${safeName}`;
}