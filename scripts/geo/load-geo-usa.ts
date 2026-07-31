import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { geoUsa } from "@/db/schema";

// ============================================================
// Источники данных — меняй версии файлов здесь
// ============================================================
const DATA_DIR = path.join(process.cwd(), "data", "geo");

const FILES = {
    simplemaps: path.join(DATA_DIR, "uscities.csv"),
    seanpianka: path.join(DATA_DIR, "zips.json"),
    census: path.join(DATA_DIR, "tl_2025_us_zcta520.csv"),
} as const;

const CHUNK_SIZE = 1000;

// ---------- validators ----------
function validateLat(val: unknown): string | null {
    const n = Number(val);
    return Number.isFinite(n) && n >= -90 && n <= 90 ? n.toFixed(6) : null;
}
function validateLng(val: unknown): string | null {
    const n = Number(val);
    return Number.isFinite(n) && n >= -180 && n <= 180 ? n.toFixed(6) : null;
}
function validatePositiveFloat(val: unknown): string | null {
    const n = Number(val);
    return Number.isFinite(n) && n >= 0 ? String(n) : null;
}
function validatePositiveInt(val: unknown): number | null {
    const n = parseInt(String(val ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

function ensureDataReady(): boolean {
    // 1. Папка data/geo — создаём молча, если нет
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 2. Проверка файлов из FILES
    const missing = Object.entries(FILES)
        .filter(([, filePath]) => !fs.existsSync(filePath))
        .map(([key, filePath]) => ({ key, filePath, name: path.basename(filePath) }));

    if (missing.length === 0) {
        return true;
    }

    console.error("\n❌ Не найдены исходные файлы для загрузки geo_usa.\n");
    console.error(`Папка: ${DATA_DIR}\n`);
    console.error("Положи туда следующие файлы:\n");

    for (const m of missing) {
        console.error(`  • ${m.name}`);
        console.error(`    ключ: ${m.key}`);
        console.error(`    путь: ${m.filePath}\n`);
    }

    console.error("Ожидаемые источники:");
    console.error("  simplemaps → uscities.csv          (simplemaps.com)");
    console.error("  seanpianka → zips.json             (seanpianka/zips)");
    console.error("  census     → tl_2025_us_zcta520.csv (census.gov ZCTA)\n");
    console.error("После этого снова: pnpm db:geo:load\n");

    return false;
}

function parseCsvLine(line: string, sep = ","): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === sep && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ============================================================
// 1. simplemaps (uscities.csv)
// ============================================================
async function loadSimplemaps() {
    const file = FILES.simplemaps;
    if (!fs.existsSync(file)) {
        console.log(`Файл не найден: ${file}`);
        return;
    }

    console.log("Загрузка simplemaps.com (1 ZIP = 1 строка + alternate_cities)...");

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
        console.log("CSV пустой");
        return;
    }

    const headers = parseCsvLine(lines[0]);
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length !== headers.length) continue;

        const data: Record<string, string> = {};
        headers.forEach((h, idx) => {
            data[h] = cols[idx] ?? "";
        });

        const zips = (data.zips ?? "").trim().split(/\s+/);

        for (const zip of zips) {
            if (!/^\d{5}$/.test(zip)) continue;

            let population = validatePositiveInt(data.population) ?? 0;
            if (population === 0) population = 1;

            const incorporated =
                String(data.incorporated ?? "").toUpperCase() === "TRUE";
            const military =
                String(data.military ?? "").toUpperCase() === "TRUE";

            const city = (data.city ?? "").trim();
            const cityAscii = data.city_ascii ?? "";

            // Upsert: при конфликте по zip — умное слияние
            await db
                .insert(geoUsa)
                .values({
                    zip,
                    city,
                    cityAscii,
                    alternateCities: null,
                    stateId: data.state_id || null,
                    stateName: data.state_name || null,
                    countyFips: data.county_fips || null,
                    countyName: data.county_name || null,
                    cityLat: validateLat(data.lat),
                    cityLng: validateLng(data.lng),
                    population,
                    density: validatePositiveFloat(data.density),
                    ranking: validatePositiveInt(data.ranking) ?? 999,
                    incorporated,
                    military,
                    timezone: data.timezone || null,
                    sourceSimplemaps: true,
                })
                .onConflictDoUpdate({
                    target: geoUsa.zip,
                    set: {
                        population: sql`GREATEST(${geoUsa.population}, ${population})`,
                        ranking: sql`LEAST(COALESCE(${geoUsa.ranking}, 999), ${validatePositiveInt(data.ranking) ?? 999})`,
                        city: sql`CASE WHEN ${population} > COALESCE(${geoUsa.population}, 0) THEN ${city} ELSE ${geoUsa.city} END`,
                        cityAscii: sql`CASE WHEN ${population} > COALESCE(${geoUsa.population}, 0) THEN ${cityAscii} ELSE ${geoUsa.cityAscii} END`,
                        alternateCities: sql`
              TRIM(BOTH ', ' FROM CONCAT_WS(', ',
                ${geoUsa.alternateCities},
                CASE
                  WHEN ${city} IS DISTINCT FROM ${geoUsa.city}
                   AND (',' || COALESCE(${geoUsa.alternateCities}, '') || ',') NOT LIKE '%,' || ${city} || ',%'
                  THEN ${city}
                  ELSE NULL
                END
              ))
            `,
                        stateId: data.state_id || null,
                        stateName: data.state_name || null,
                        countyFips: data.county_fips || null,
                        countyName: data.county_name || null,
                        cityLat: validateLat(data.lat),
                        cityLng: validateLng(data.lng),
                        density: validatePositiveFloat(data.density),
                        incorporated,
                        military,
                        timezone: data.timezone || null,
                        sourceSimplemaps: true,
                        updatedAt: sql`now()`,
                    },
                });

            count++;
            if (count % 2000 === 0) {
                process.stdout.write(`  → ${count} записей обработано\r`);
            }
        }
    }

    console.log(`\nsimplemaps: ${count} записей обработано.`);
}

// ============================================================
// 2. seanpianka (zips.json)
// ============================================================
async function loadSeanpianka() {
    const file = FILES.seanpianka;
    if (!fs.existsSync(file)) {
        console.log(`Файл не найден: ${file}`);
        return;
    }

    console.log("Загрузка seanpianka/zips.json...");

    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) {
        console.log("Ошибка JSON");
        return;
    }

    let count = 0;

    for (const row of data) {
        const zip = String(row.zip_code ?? "");
        if (!/^\d{5}$/.test(zip)) continue;

        const zipTypeRaw = String(row.zip_code_type ?? "").toUpperCase();
        const zipType =
            zipTypeRaw === "STANDARD" ||
            zipTypeRaw === "PO BOX" ||
            zipTypeRaw === "UNIQUE" ||
            zipTypeRaw === "MILITARY"
                ? (zipTypeRaw as "STANDARD" | "PO BOX" | "UNIQUE" | "MILITARY")
                : null;

        await db
            .update(geoUsa)
            .set({
                zipType,
                isActive: Boolean(row.active),
                areaCodes: Array.isArray(row.area_codes)
                    ? (row.area_codes as string[])
                    : null,
                primaryCity: (row.city as string) || null,
                acceptableCities: Array.isArray(row.acceptable_cities)
                    ? (row.acceptable_cities as string[])
                    : null,
                unacceptableCities: Array.isArray(row.unacceptable_cities)
                    ? (row.unacceptable_cities as string[])
                    : null,
                sourceSeanpianka: true,
                updatedAt: sql`now()`,
            })
            .where(eq(geoUsa.zip, zip));

        count++;
        if (count % 5000 === 0) {
            process.stdout.write(`  → ${count} строк (seanpianka)\r`);
        }
    }

    console.log(`\nseanpianka: ${count} строк обработано.`);
}

// ============================================================
// 3. census (tl_2025_us_zcta520.csv) — разделитель ;
// ============================================================
async function loadCensus() {
    const file = FILES.census;
    if (!fs.existsSync(file)) {
        console.log(`Файл не найден: ${file}`);
        return;
    }

    console.log("\n=== ЗАГРУЗКА CENSUS.GOV ZCTA ===");
    console.log(`Файл: ${file}`);

    let content = fs.readFileSync(file, "utf8");
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1); // BOM
        console.log("BOM обнаружен и пропущен");
    }

    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
        console.log("CSV пустой");
        return;
    }

    const headers = parseCsvLine(lines[0], ";");
    let count = 0;
    //let updated = 0;

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i], ";");
        if (cols.length !== headers.length) continue;

        const data: Record<string, string> = {};
        headers.forEach((h, idx) => {
            data[h] = cols[idx] ?? "";
        });

        const zcta = data.ZCTA5CE20 ?? "";
        if (!/^\d{5}$/.test(zcta)) continue;

        const result = await db
            .update(geoUsa)
            .set({
                zcta: sql`COALESCE(${geoUsa.zcta}, ${zcta})`,
                zctaLat: sql`COALESCE(${geoUsa.zctaLat}, ${validateLat(data.INTPTLAT20)})`,
                zctaLng: sql`COALESCE(${geoUsa.zctaLng}, ${validateLng(data.INTPTLON20)})`,
                sourceCensus: true,
                updatedAt: sql`now()`,
            })
            .where(eq(geoUsa.zip, zcta));

        count++;
        // rowCount в drizzle/postgres может быть недоступен одинаково — считаем попытки
        if (count % 10000 === 0) {
            process.stdout.write(`  Обработано: ${count}\r`);
        }
    }

    console.log(`\n=== ГОТОВО ===`);
    console.log(`Обработано строк: ${count}`);
}

// ============================================================
// main
// ============================================================
async function main() {

    if (!ensureDataReady()) {
        process.exit(1);
    }

    console.log("\n🌍 Geo USA loader\n");
    console.log("FILES:");
    console.log(`  simplemaps: ${FILES.simplemaps}`);
    console.log(`  seanpianka: ${FILES.seanpianka}`);
    console.log(`  census:     ${FILES.census}\n`);

    await loadSimplemaps();
    await loadSeanpianka();
    await loadCensus();

    console.log("\n✅ load-geo-usa завершён.");
    console.log("Дальше: pnpm db:geo:generate-slugs && pnpm db:geo:export-to-xml\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ load-geo-usa failed:", err);
    process.exit(1);
});
