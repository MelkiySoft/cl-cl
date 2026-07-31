import "dotenv/config";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { geoUsa } from "@/db/schema";

const EXPORT_DIR = path.join(process.cwd(), "exports");
const DEFAULT_FILE = path.join(EXPORT_DIR, "geo_usa_full.xml");
const CHUNK_SIZE = 1000;

function esc(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

async function main() {
    const filename = process.argv[2] || DEFAULT_FILE;

    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    console.log(`\n📄 Экспорт в XML: ${filename}\n`);

    const file = fs.createWriteStream(filename, { encoding: "utf8" });
    file.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    file.write(`<geo_usa_dataset>\n`);

    let offset = 0;
    let total = 0;

    while (true) {
        const rows = await db
            .select()
            .from(geoUsa)
            .orderBy(geoUsa.zip)
            .limit(CHUNK_SIZE)
            .offset(offset);

        if (rows.length === 0) break;

        for (const row of rows) {
            file.write(`  <record id="${row.id}" zip="${esc(row.zip)}">\n`);

            for (const [key, value] of Object.entries(row)) {
                if (key === "id" || key === "zip") continue;

                let out: string;
                if (
                    (key === "areaCodes" ||
                        key === "acceptableCities" ||
                        key === "unacceptableCities") &&
                    value != null
                ) {
                    const json =
                        typeof value === "string" ? value : JSON.stringify(value);
                    out = `<![CDATA[${json}]]>`;
                } else {
                    out = esc(value);
                }

                // snake_case в XML как в PHP-экспорте
                const tag = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
                file.write(`    <${tag}>${out}</${tag}>\n`);
            }

            file.write(`  </record>\n`);
        }

        total += rows.length;
        offset += CHUNK_SIZE;
        process.stdout.write(`  → Экспортировано: ${total}\r`);
    }

    file.write(`</geo_usa_dataset>\n`);
    file.end();

    await new Promise<void>((resolve, reject) => {
        file.on("finish", resolve);
        file.on("error", reject);
    });

    console.log(`\nЭкспорт завершён: ${total} строк → ${filename}\n`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ export-to-xml failed:", err);
    process.exit(1);
});