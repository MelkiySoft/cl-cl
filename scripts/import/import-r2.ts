import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;
const publicUrl = process.env.R2_PUBLIC_URL!;

export function assertR2Env() {
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
        throw new Error("Missing R2 environment variables");
    }
}

export const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export function getPublicUrl(key: string) {
    return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}

export function extractKey(url: string | null | undefined): string | null {
    if (!url) return null;
    const prefix = `${publicUrl.replace(/\/+$/, "")}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length) || null;
}

export function makeCompanyKey(companyId: number, filename: string) {
    const uuid = crypto.randomUUID().slice(0, 8);
    const safeName = filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return `companies/${companyId}/${uuid}-${safeName}`;
}

export async function uploadPublicFile(
    key: string,
    body: Buffer,
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

export async function deletePublicFile(key: string) {
    await r2.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}
