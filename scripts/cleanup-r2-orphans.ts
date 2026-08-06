/**
 * Очистка осиротевших файлов в R2.
 *
 * Собирает все используемые image-URL из БД (users, companies, company_images, categories),
 * вытаскивает из них ключи и удаляет всё лишнее в папках users/, companies/, categories/.
 *
 * Использование:
 *   pnpm tsx scripts/cleanup-r2-orphans.ts          # dry-run (только показывает)
 *   pnpm tsx scripts/cleanup-r2-orphans.ts --execute # реально удаляет
 */

import "dotenv/config";
import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
    users,
    companies,
    companyImages,
    categories,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// R2 client (не используем lib/r2.ts из-за "server-only")
// ---------------------------------------------------------------------------

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET!;
const publicUrl = process.env.R2_PUBLIC_URL!; // без слэша в конце

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    console.error("Missing R2 environment variables");
    process.exit(1);
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

const FOLDERS = ["users", "companies", "categories"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractKey(url: string | null | undefined): string | null {
    if (!url) return null;
    const prefix = publicUrl + "/";
    if (!url.startsWith(prefix)) return null;
    const key = url.slice(prefix.length);
    return key || null;
}

async function collectUsedKeys(): Promise<Set<string>> {
    const keys = new Set<string>();

    // users.image
    const userRows = await db
        .select({ image: users.image })
        .from(users)
        .where(isNotNull(users.image));

    for (const row of userRows) {
        const key = extractKey(row.image);
        if (key) keys.add(key);
    }

    // companies.image
    const companyRows = await db
        .select({ image: companies.image })
        .from(companies)
        .where(isNotNull(companies.image));

    for (const row of companyRows) {
        const key = extractKey(row.image);
        if (key) keys.add(key);
    }

    // company_images.image
    const galleryRows = await db
        .select({ image: companyImages.image })
        .from(companyImages);

    for (const row of galleryRows) {
        const key = extractKey(row.image);
        if (key) keys.add(key);
    }

    // categories.image
    const categoryRows = await db
        .select({ image: categories.image })
        .from(categories)
        .where(isNotNull(categories.image));

    for (const row of categoryRows) {
        const key = extractKey(row.image);
        if (key) keys.add(key);
    }

    return keys;
}

async function listAllKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
        const res = await r2.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            })
        );

        for (const obj of res.Contents ?? []) {
            if (obj.Key) keys.push(obj.Key);
        }

        continuationToken = res.IsTruncated
            ? res.NextContinuationToken
            : undefined;
    } while (continuationToken);

    return keys;
}

async function deleteKey(key: string): Promise<void> {
    await r2.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const execute = process.argv.includes("--execute");

    console.log("\nR2 orphans cleanup");
    console.log("Mode:", execute ? "EXECUTE (will delete)" : "DRY-RUN (only list)");
    console.log("Bucket:", bucket);
    console.log("Public URL:", publicUrl);
    console.log("");

    console.log("Collecting used keys from database...");
    const usedKeys = await collectUsedKeys();
    console.log(`  Found ${usedKeys.size} used keys in DB\n`);

    let totalOrphans = 0;
    let totalDeleted = 0;

    for (const folder of FOLDERS) {
        const prefix = `${folder}/`;
        console.log(`Scanning ${prefix} ...`);

        const allKeys = await listAllKeys(prefix);
        const orphans = allKeys.filter((key) => !usedKeys.has(key));

        console.log(`  Objects in R2: ${allKeys.length}`);
        console.log(`  Orphans:       ${orphans.length}`);

        if (orphans.length > 0) {
            // Показываем первые 15 для наглядности
            const preview = orphans.slice(0, 15);
            for (const key of preview) {
                console.log(`    - ${key}`);
            }
            if (orphans.length > 15) {
                console.log(`    ... and ${orphans.length - 15} more`);
            }
        }

        if (execute && orphans.length > 0) {
            console.log(`  Deleting ${orphans.length} objects...`);
            for (const key of orphans) {
                await deleteKey(key);
                totalDeleted++;
            }
            console.log(`  Done.`);
        }

        totalOrphans += orphans.length;
        console.log("");
    }

    console.log("—".repeat(40));
    console.log(`Total orphans found: ${totalOrphans}`);

    if (execute) {
        console.log(`Total deleted:       ${totalDeleted}`);
    } else if (totalOrphans > 0) {
        console.log(`\nTo actually delete run:`);
        console.log(`  pnpm tsx scripts/cleanup-r2-orphans.ts --execute`);
    } else {
        console.log("Nothing to clean.");
    }

    console.log("");
    process.exit(0);
}

main().catch((err) => {
    console.error("cleanup-r2-orphans failed:", err);
    process.exit(1);
});