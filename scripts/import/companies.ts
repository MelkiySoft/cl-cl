/**
 * Импорт компаний из data/import/companies/companies.xml
 *
 *   pnpm db:import:companies
 *   pnpm db:import:companies -- --dry-run
 *   pnpm db:import:companies -- --limit=20
 *   pnpm db:import:companies -- --start=20
 *   pnpm db:import:companies -- --start=20 --limit=20
 *   pnpm db:import:companies -- --delete-local-images
 *
 * Картинки: data/import/companies/images/
 * В R2 заливаются всегда. Локальный файл удаляется только с --delete-local-images.
 * Если у уже существующей (не claimed) компании есть хотя бы один
 * локальный файл — старый набор в R2 и БД удаляется целиком, пишется новый.
 */

import "dotenv/config";

import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import {
    attributeValues,
    attributes,
    categories,
    categoryPath,
    companies,
    companyAttributes,
    companyHours,
    companyImages,
    companyLinks,
    companyToCategory,
    cities,
    geoUsa,
} from "@/db/schema";
import { slugify } from "@/lib/utils";

import { loadCompaniesXml, type RawCompanyRow } from "./companies-xml";
import {
    collectLinks,
    compactKey,
    formatServiceCity,
    parseFirstEmail,
    isValidZip,
    mapBooleanYes,
    mapBooleanYesNo,
    mapCancellation,
    mapCategoryName,
    mapInsured,
    mapLanguages,
    mapOwned,
    mapPayments,
    mapTeamSize,
    mapYearFounded,
    normKey,
    normalizeAreaText,
    normalizeAreaToken,
    parseAddress,
    parseCityState,
    parseHours,
    parseZipList,
    unique,
    areaTokenKeys,
    isSilentIgnoredCategory,
} from "./companies-map";
import {
    assertR2Env,
    deletePublicFile,
    extractKey,
    makeCompanyKey,
    uploadPublicFile,
} from "./import-r2";

const XML_PATH = path.resolve("data/import/companies/companies.xml");
const IMAGES_DIR = path.resolve("data/import/companies/images");
const LOG_PATH = path.resolve("logs/import-companies.log");

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const WEBP_QUALITY = 82;
const MAX_SIDE = 1600;

type GeoRow = {
    zip: string;
    city: string | null;
    cityAscii: string | null;
    stateId: string | null;
    primaryCity: string | null;
    alternateCities: string | null;
    acceptableCities: string[] | null;
};

type AttrCatalog = {
    id: number;
    name: string;
    type: string;
    values: Map<string, { id: number; name: string }>;
};

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has("--dry-run");
const DELETE_LOCAL_IMAGES = argv.has("--delete-local-images");
const LIMIT = Number(
    process.argv.find((arg) => arg.startsWith("--limit="))?.slice(8) ?? ""
);
const START = Number(
    process.argv.find((arg) => arg.startsWith("--start="))?.slice(8) ?? ""
);

const logLines: string[] = [];

function log(message: string) {
    const line = `[${new Date().toISOString()}] ${message}`;
    logLines.push(line);
    console.log(message);
}

function warn(message: string) {
    log(`WARN  ${message}`);
}

async function flushLog() {
    mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    await writeFile(LOG_PATH, `${logLines.join("\n")}\n`, "utf8");
}

function resolveImagePath(filename: string): string | null {
    if (!filename) return null;
    const direct = path.join(IMAGES_DIR, filename);
    if (existsSync(direct)) return direct;
    return null;
}

async function normalizeImage(filePath: string): Promise<Buffer> {
    const pipeline = sharp(filePath, { failOn: "none", limitInputPixels: 50_000_000 })
        .rotate()
        .resize({
            width: MAX_SIDE,
            height: MAX_SIDE,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 });
    return pipeline.toBuffer();
}

async function loadCatalogs() {
    const categoryRows = await db
        .select({
            id: categories.id,
            slug: categories.slug,
            name: categories.name,
        })
        .from(categories);

    const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row]));

    const pathRows = await db.select().from(categoryPath);
    const pathIdsByCategory = new Map<number, number[]>();
    for (const row of pathRows) {
        const list = pathIdsByCategory.get(row.categoryId) ?? [];
        list.push(row.pathId);
        pathIdsByCategory.set(row.categoryId, list);
    }

    const attrRows = await db.select().from(attributes);
    const valueRows = await db.select().from(attributeValues);
    const attrByName = new Map<string, AttrCatalog>();
    for (const row of attrRows) {
        attrByName.set(row.name, {
            id: row.id,
            name: row.name,
            type: row.type,
            values: new Map(),
        });
    }
    const attrById = new Map(attrRows.map((row) => [row.id, row.name]));
    for (const row of valueRows) {
        const name = attrById.get(row.attributeId);
        if (!name) continue;
        const attr = attrByName.get(name);
        if (!attr) continue;
        attr.values.set(normKey(row.name), { id: row.id, name: row.name });
    }

    return { categoryBySlug, pathIdsByCategory, attrByName };
}

async function loadGeoIndex(stateIds: string[]) {
    if (stateIds.length === 0) {
        return {
            byCity: new Map<string, GeoRow[]>(),
            byAlias: new Map<string, GeoRow[]>(),
        };
    }

    const rows = await db
        .select({
            zip: geoUsa.zip,
            city: geoUsa.city,
            cityAscii: geoUsa.cityAscii,
            stateId: geoUsa.stateId,
            primaryCity: geoUsa.primaryCity,
            alternateCities: geoUsa.alternateCities,
            acceptableCities: geoUsa.acceptableCities,
        })
        .from(geoUsa)
        .where(and(inArray(geoUsa.stateId, stateIds), eq(geoUsa.isActive, true)));

    const byCity = new Map<string, GeoRow[]>();
    const byAlias = new Map<string, GeoRow[]>();

    const push = (map: Map<string, GeoRow[]>, key: string, row: GeoRow) => {
        if (!key) return;
        const list = map.get(key) ?? [];
        list.push(row);
        map.set(key, list);
    };

    for (const row of rows) {
        const aliases = new Set<string>();
        for (const name of [row.city, row.cityAscii, row.primaryCity]) {
            if (name) aliases.add(normKey(name));
        }
        if (row.alternateCities) {
            for (const token of row.alternateCities.split(/[;,]/)) {
                const key = normKey(token);
                if (key) aliases.add(key);
            }
        }
        if (row.acceptableCities) {
            for (const token of row.acceptableCities) {
                const key = normKey(token);
                if (key) aliases.add(key);
            }
        }

        for (const key of aliases) {
            push(byAlias, `${row.stateId}:${key}`, row);
            push(byAlias, `${row.stateId}:${compactKey(key)}`, row);
        }
        if (row.city) {
            push(byCity, `${row.stateId}:${normKey(row.city)}`, row);
            push(byCity, `${row.stateId}:${compactKey(row.city)}`, row);
        }
    }

    return { byCity, byAlias };
}

function nextSlug(base: string, taken: Set<string>) {
    const root = base || "company";
    if (!taken.has(root)) return root;
    let i = 2;
    while (taken.has(`${root}-${i}`)) i += 1;
    return `${root}-${i}`;
}

function localImageFiles(row: RawCompanyRow): Array<{ file: string; cover: boolean }> {
    const files: Array<{ file: string; cover: boolean }> = [];
    const seen = new Set<string>();
    const add = (name: string, cover: boolean) => {
        if (!name || seen.has(name.toLowerCase())) return;
        const full = resolveImagePath(name);
        if (!full) return;
        seen.add(name.toLowerCase());
        files.push({ file: full, cover });
    };
    add(row.logo, true);
    for (const photo of row.photos) add(photo, false);
    return files;
}

async function replaceImages(opts: {
    companyId: number;
    oldCover: string | null;
    oldGallery: string[];
    files: Array<{ file: string; cover: boolean }>;
}) {
    const uploaded: Array<{ url: string; key: string; cover: boolean; source: string }> = [];

    for (const item of opts.files) {
        const fileStat = await stat(item.file);
        if (fileStat.size > MAX_INPUT_BYTES) {
            warn(`image too large (${fileStat.size}b): ${item.file}`);
            continue;
        }
        const buffer = await normalizeImage(item.file);
        const key = makeCompanyKey(opts.companyId, `${path.parse(item.file).name}.webp`);
        const url = await uploadPublicFile(key, buffer, "image/webp");
        uploaded.push({ url, key, cover: item.cover, source: item.file });
    }

    if (uploaded.length === 0) return { cover: opts.oldCover, uploaded: [] as typeof uploaded };

    const cover =
        uploaded.find((item) => item.cover)?.url ?? uploaded[0]?.url ?? null;
    const gallery = uploaded.filter((item) => item.url !== cover);

    await db.delete(companyImages).where(eq(companyImages.companyId, opts.companyId));
    if (gallery.length > 0) {
        await db.insert(companyImages).values(
            gallery.map((item, index) => ({
                companyId: opts.companyId,
                image: item.url,
                sortOrder: index,
            }))
        );
    }

    await db
        .update(companies)
        .set({ image: cover, updatedAt: new Date() })
        .where(eq(companies.id, opts.companyId));

    const oldKeys = [
        extractKey(opts.oldCover),
        ...opts.oldGallery.map(extractKey),
    ].filter((key): key is string => Boolean(key));

    for (const key of oldKeys) {
        try {
            await deletePublicFile(key);
        } catch (err) {
            warn(`failed to delete old r2 key ${key}: ${String(err)}`);
        }
    }

    if (DELETE_LOCAL_IMAGES) {
        for (const item of uploaded) {
            try {
                unlinkSync(item.source);
            } catch (err) {
                warn(`failed to delete local image ${item.source}: ${String(err)}`);
            }
        }
    }

    return { cover, uploaded };
}

async function replaceChildren(companyId: number, built: BuiltCompany) {
    await db.delete(companyToCategory).where(eq(companyToCategory.companyId, companyId));
    await db.delete(companyHours).where(eq(companyHours.companyId, companyId));
    await db.delete(companyLinks).where(eq(companyLinks.companyId, companyId));
    await db.delete(companyAttributes).where(eq(companyAttributes.companyId, companyId));

    if (built.categoryLinks.length > 0) {
        await db.insert(companyToCategory).values(
            built.categoryLinks.map((row) => ({
                companyId,
                categoryId: row.categoryId,
                isMain: row.isMain,
            }))
        );
    }
    if (built.hours.slots.length > 0 && built.hours.mode === "weekly") {
        await db.insert(companyHours).values(
            built.hours.slots.map((slot) => ({
                companyId,
                weekday: slot.weekday,
                openTime: slot.openTime,
                closeTime: slot.closeTime,
                isClosed: slot.isClosed,
                sortOrder: slot.sortOrder,
            }))
        );
    }
    if (built.links.length > 0) {
        await db.insert(companyLinks).values(
            built.links.map((link, index) => ({
                companyId,
                type: link.type,
                url: link.url,
                sortOrder: index,
            }))
        );
    }
    if (built.attributeRows.length > 0) {
        await db.insert(companyAttributes).values(
            built.attributeRows.map((row) => ({
                companyId,
                attributeId: row.attributeId,
                valueId: row.valueId,
                valueBoolean: row.valueBoolean,
                valueNumber: row.valueNumber,
            }))
        );
    }
}

type BuiltCompany = {
    values: {
        source: "imported";
        externalId: string;
        entityType: "company";
        legalName: string;
        name: string;
        slug: string;
        phone: string | null;
        email: string | null;
        yearFounded: number | null;
        employeesCount: number | null;
        isInsured: boolean;
        hoursMode: "weekly" | "always_open" | "by_appointment";
        hoursNote: string | null;
        hqAddressLine1: string | null;
        hqCity: string | null;
        hqState: string | null;
        hqZip: string | null;
        cityId: number | null;
        sCity: string | null;
        sZips: string[];
        sArea: string | null;
        status: true;
        moderationStatus: "approved";
        approvedAt: Date;
        updatedAt: Date;
    };
    categoryLinks: Array<{ categoryId: number; isMain: boolean }>;
    hours: NonNullable<ReturnType<typeof parseHours>>;
    links: ReturnType<typeof collectLinks>;
    attributeRows: Array<{
        attributeId: number;
        valueId: number | null;
        valueBoolean: boolean | null;
        valueNumber: number | null;
    }>;
    ignoredCategories: string[];
    unmatchedAreas: string[];
    ignoredPayments: string[];
};

function buildCompany(
    row: RawCompanyRow,
    ctx: {
        categoryBySlug: Map<string, { id: number; slug: string; name: string }>;
        pathIdsByCategory: Map<number, number[]>;
        attrByName: Map<string, AttrCatalog>;
        geo: Awaited<ReturnType<typeof loadGeoIndex>>;
        takenSlugs: Set<string>;
        existingSlug?: string;
    }
): BuiltCompany | null {
    if (!row.externalId || !row.name) return null;

    const parsedCity = parseCityState(row.serviceCity);
    const address = parseAddress(row.address);
    const hqState = address.state ?? parsedCity?.state ?? null;
    const hqCity = address.city ?? parsedCity?.city ?? null;
    const sCity = formatServiceCity(row.serviceCity);
    const mainCityKey = parsedCity ? normKey(parsedCity.city) : hqCity ? normKey(hqCity) : "";
    const mainState = parsedCity?.state ?? hqState;

    const explicitZips = parseZipList(row.serviceZips);
    const areaTokens = row.serviceArea
        ? row.serviceArea.split(";").map((part) => part.trim()).filter(Boolean)
        : [];
    const unmatchedAreas: string[] = [];
    const areaZips: string[] = [];

    for (const token of areaTokens) {
        // редкие склейки через перевод строки — не матчим и не пишем в unmatched
        if (/[\r\n]/.test(token)) continue;

        const tokenKeys = areaTokenKeys(token);
        if (tokenKeys.length === 0 || !mainState) {
            if (normalizeAreaToken(token)) unmatchedAreas.push(token);
            continue;
        }

        const isMainCity = tokenKeys.some(
            (key) => key === mainCityKey || key === compactKey(mainCityKey)
        );
        if (isMainCity) continue;

        let matched: GeoRow[] = [];
        for (const key of tokenKeys) {
            matched = ctx.geo.byCity.get(`${mainState}:${key}`) ?? [];
            if (matched.length > 0) break;
        }
        if (matched.length === 0) {
            for (const key of tokenKeys) {
                matched = ctx.geo.byAlias.get(`${mainState}:${key}`) ?? [];
                if (matched.length > 0) break;
            }
        }
        if (matched.length === 0) {
            unmatchedAreas.push(token);
            continue;
        }
        for (const geo of matched) {
            if (isValidZip(geo.zip)) areaZips.push(geo.zip);
        }
    }

    const slug = ctx.existingSlug ?? nextSlug(slugify(row.name), ctx.takenSlugs);
    ctx.takenSlugs.add(slug);

    const hours = parseHours(row.hours) ?? {
        mode: "weekly" as const,
        note: row.hours || null,
        slots: [],
    };

    const mappedSlugs: string[] = [];
    const ignoredCategories: string[] = [];
    for (const name of row.categories) {
        const slugOrNull = mapCategoryName(name);
        if (!slugOrNull) {
            if (!isSilentIgnoredCategory(name)) ignoredCategories.push(name);
            continue;
        }
        mappedSlugs.push(slugOrNull);
    }

    const categoryLinks: Array<{ categoryId: number; isMain: boolean }> = [];
    const seenCat = new Set<number>();
    let mainId: number | null = null;
    for (const catSlug of mappedSlugs) {
        const cat = ctx.categoryBySlug.get(catSlug);
        if (!cat) {
            ignoredCategories.push(catSlug);
            continue;
        }
        if (mainId === null) mainId = cat.id;
        const ids = uniqueIds([...(ctx.pathIdsByCategory.get(cat.id) ?? []), cat.id]);
        for (const categoryId of ids) {
            if (seenCat.has(categoryId)) continue;
            seenCat.add(categoryId);
            categoryLinks.push({
                categoryId,
                isMain: categoryId === mainId,
            });
        }
    }

    const languages = mapLanguages(row.languages);
    const payments = mapPayments(row.paymentMethods);
    const owned = mapOwned(row.owned);
    const cancellation = mapCancellation(row.cancellationPolicy);
    const eco = mapBooleanYes(row.ecoFriendly);
    const sameDay = mapBooleanYes(row.sameDayBooking);
    const franchise = mapBooleanYesNo(row.franchiseAffiliation);
    const guarantee = mapBooleanYes(row.serviceGuarantee);

    const attributeRows: BuiltCompany["attributeRows"] = [];
    const pushChoice = (attrName: string, valueName: string) => {
        const attr = ctx.attrByName.get(attrName);
        const value = attr?.values.get(normKey(valueName));
        if (!attr || !value) return;
        attributeRows.push({
            attributeId: attr.id,
            valueId: value.id,
            valueBoolean: null,
            valueNumber: null,
        });
    };
    const pushBool = (attrName: string, value: boolean | null) => {
        if (value === null) return;
        const attr = ctx.attrByName.get(attrName);
        if (!attr) return;
        attributeRows.push({
            attributeId: attr.id,
            valueId: null,
            valueBoolean: value,
            valueNumber: null,
        });
    };

    for (const name of languages) pushChoice("Languages", name);
    for (const name of payments.values) pushChoice("Payment methods", name);
    for (const name of owned) pushChoice("Owned", name);
    if (cancellation) pushChoice("Cancellation policy", cancellation);
    pushBool("Eco-friendly products", eco);
    pushBool("Same-day booking", sameDay);
    pushBool("Franchise affiliation", franchise);
    pushBool("Service guarantee", guarantee);

    const email = parseFirstEmail(row.email);
    if (row.email.trim() && !email) {
        warn(`${row.externalId}: skip bad email "${row.email}"`);
    }

    const hqZip = isValidZip(row.hqZip) ? row.hqZip.trim() : null;
    if (row.hqZip && !hqZip) warn(`${row.externalId}: skip bad office zip "${row.hqZip}"`);

    const yearFounded = mapYearFounded(row.yearsInBusiness);
    const employeesCount = mapTeamSize(row.teamSize);
    const insured = mapInsured(row.insuranceStatus);

    return {
        values: {
            source: "imported",
            externalId: row.externalId,
            entityType: "company",
            legalName: row.name,
            name: row.name,
            slug,
            phone: row.phone || null,
            email,
            yearFounded,
            employeesCount,
            isInsured: insured ?? false,
            hoursMode: hours.mode,
            hoursNote: hours.note,
            hqAddressLine1: address.line1,
            hqCity,
            hqState,
            hqZip,
            cityId: null,
            sCity,
            sZips: unique([...explicitZips, ...areaZips]),
            sArea: normalizeAreaText(row.serviceArea),
            status: true,
            moderationStatus: "approved",
            approvedAt: new Date(),
            updatedAt: new Date(),
        },
        categoryLinks,
        hours,
        links: collectLinks(row),
        attributeRows,
        ignoredCategories: unique(ignoredCategories),
        unmatchedAreas,
        ignoredPayments: payments.ignored,
    };
}

function uniqueIds(ids: number[]): number[] {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

async function main() {
    log(
        `Company import started${DRY_RUN ? " (dry-run)" : ""}${DELETE_LOCAL_IMAGES ? " (delete-local-images)" : ""}`
    );
    if (!existsSync(XML_PATH)) {
        throw new Error(`XML not found: ${XML_PATH}`);
    }
    if (!DRY_RUN) assertR2Env();

    const rows = loadCompaniesXml(XML_PATH).filter((row) => row.externalId && row.name);
    const start = Number.isFinite(START) && START > 0 ? Math.floor(START) : 0;
    const limited =
        Number.isFinite(LIMIT) && LIMIT > 0
            ? rows.slice(start, start + LIMIT)
            : rows.slice(start);
    log(
        `Rows in file: ${rows.length}, start: ${start}, processing: ${limited.length}`
    );

    const { categoryBySlug, pathIdsByCategory, attrByName } = await loadCatalogs();

    const stateIds = new Set<string>();
    for (const row of limited) {
        const fromCity = parseCityState(row.serviceCity)?.state;
        const fromAddress = parseAddress(row.address).state;
        if (fromCity) stateIds.add(fromCity);
        if (fromAddress) stateIds.add(fromAddress);
    }
    const geo = await loadGeoIndex([...stateIds]);
    log(`Geo rows indexed for states: ${[...stateIds].join(", ") || "—"}`);

    const cityRows = await db
        .select({
            id: cities.id,
            name: cities.name,
            stateId: cities.stateId,
        })
        .from(cities);
    const cityIdByLabel = new Map(
        cityRows.map((row) => [
            `${row.name} ${row.stateId}`.toLowerCase(),
            row.id,
        ])
    );
    if (cityRows.length === 0) {
        warn("cities table is empty — city_id will stay null. Run pnpm db:geo:build-cities");
    }

    const existing = await db
        .select({
            id: companies.id,
            externalId: companies.externalId,
            claimedAt: companies.claimedAt,
            slug: companies.slug,
            image: companies.image,
            isInsured: companies.isInsured,
            yearFounded: companies.yearFounded,
            employeesCount: companies.employeesCount,
        })
        .from(companies);

    const byExternal = new Map(
        existing
            .filter((row) => row.externalId)
            .map((row) => [row.externalId as string, row])
    );
    const takenSlugs = new Set(existing.map((row) => row.slug));

    const galleryByCompany = new Map<number, string[]>();
    if (!DRY_RUN) {
        const gallery = await db
            .select({
                companyId: companyImages.companyId,
                image: companyImages.image,
            })
            .from(companyImages);
        for (const row of gallery) {
            const list = galleryByCompany.get(row.companyId) ?? [];
            list.push(row.image);
            galleryByCompany.set(row.companyId, list);
        }
    }

    let created = 0;
    let updated = 0;
    let skippedClaimed = 0;
    let skippedInvalid = 0;
    let imagesWritten = 0;

    for (const [index, row] of limited.entries()) {
        const current = byExternal.get(row.externalId);
        if (current?.claimedAt) {
            skippedClaimed += 1;
            warn(`${row.externalId}: claimed_at set — skip`);
            continue;
        }

        const built = buildCompany(row, {
            categoryBySlug,
            pathIdsByCategory,
            attrByName,
            geo,
            takenSlugs,
            existingSlug: current?.slug,
        });
        if (!built) {
            skippedInvalid += 1;
            warn(`${row.externalId || index}: missing external_id/name — skip`);
            continue;
        }

        for (const name of built.ignoredCategories) {
            warn(`${row.externalId}: ignore category "${name}"`);
        }
        for (const token of built.unmatchedAreas) {
            warn(`${row.externalId}: unmatched area "${token}"`);
        }
        for (const token of built.ignoredPayments) {
            warn(`${row.externalId}: ignore payment "${token}"`);
        }

        const files = localImageFiles(row);
        for (const name of [row.logo, ...row.photos]) {
            if (name && !resolveImagePath(name)) {
                warn(`${row.externalId}: image not found ${name}`);
            }
        }

        if (DRY_RUN) {
            log(
                `DRY  ${current ? "update" : "create"} ${row.externalId} slug=${built.values.slug} cats=${built.categoryLinks.length} zips=${built.values.sZips.length} images=${files.length}`
            );
            continue;
        }

        const payload = { ...built.values };
        if (payload.sCity) {
            payload.cityId = cityIdByLabel.get(payload.sCity.toLowerCase()) ?? null;
        }
        if (current && row.insuranceStatus.trim() === "") {
            payload.isInsured = current.isInsured;
        }
        if (current && payload.yearFounded === null) {
            payload.yearFounded = current.yearFounded;
        }
        if (current && payload.employeesCount === null) {
            payload.employeesCount = current.employeesCount;
        }

        let companyId: number;
        if (current) {
            await db
                .update(companies)
                .set(payload)
                .where(eq(companies.id, current.id));
            companyId = current.id;
            updated += 1;
        } else {
            const inserted = await db
                .insert(companies)
                .values({
                    ...payload,
                    userId: null,
                    claimedAt: null,
                    createdAt: new Date(),
                })
                .returning({ id: companies.id });
            companyId = inserted[0].id;
            created += 1;
            byExternal.set(row.externalId, {
                id: companyId,
                externalId: row.externalId,
                claimedAt: null,
                slug: payload.slug,
                image: null,
                isInsured: payload.isInsured,
                yearFounded: payload.yearFounded,
                employeesCount: payload.employeesCount,
            });
        }

        await replaceChildren(companyId, built);

        if (files.length > 0) {
            const result = await replaceImages({
                companyId,
                oldCover: current?.image ?? null,
                oldGallery: galleryByCompany.get(companyId) ?? [],
                files,
            });
            imagesWritten += result.uploaded.length;
        }

        if ((index + 1) % 25 === 0) {
            log(`… ${index + 1}/${limited.length}`);
        }
    }

    log(
        `Done. created=${created} updated=${updated} skipped_claimed=${skippedClaimed} skipped_invalid=${skippedInvalid} images=${imagesWritten}`
    );
    await flushLog();
    log(`Log written: ${LOG_PATH}`);
    process.exit(0);
}

main().catch(async (err) => {
    console.error("Company import failed:", err);
    logLines.push(String(err));
    try {
        await flushLog();
    } catch {
        // ignore
    }
    process.exit(1);
});
