import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { cities, cityZips, geoUsa } from "@/db/schema";

/**
 * Стартовый набор витрины.
 * Только эти города получают is_active + is_public.
 * Остальные при первой заливке и при появлении новых строк — оба флага false.
 */
const DEFAULT_PUBLIC_CITIES = [
    { name: "Jacksonville", stateId: "FL" },
    { name: "Orlando", stateId: "FL" },
] as const;

const ZIP_CHUNK = 1000;

function asciiName(input: string): string {
    const replace: Record<string, string> = {
        á: "a", à: "a", â: "a", ã: "a", ä: "a", å: "a", æ: "ae",
        é: "e", è: "e", ê: "e", ë: "e",
        í: "i", ì: "i", î: "i", ï: "i",
        ó: "o", ò: "o", ô: "o", õ: "o", ö: "o", ø: "o", œ: "oe",
        ú: "u", ù: "u", û: "u", ü: "u",
        ñ: "n", ç: "c", ý: "y", ÿ: "y", ß: "ss",
    };

    return input
        .replace(/./g, (ch) => replace[ch] ?? replace[ch.toLowerCase()] ?? ch)
        .toLowerCase()
        .trim();
}

function slugify(input: string): string {
    const replace: Record<string, string> = {
        á: "a", à: "a", â: "a", ã: "a", ä: "a", å: "a", æ: "ae",
        é: "e", è: "e", ê: "e", ë: "e",
        í: "i", ì: "i", î: "i", ï: "i",
        ó: "o", ò: "o", ô: "o", õ: "o", ö: "o", ø: "o", œ: "oe",
        ú: "u", ù: "u", û: "u", ü: "u",
        ñ: "n", ç: "c", ý: "y", ÿ: "y", ß: "ss",
    };

    let slug = input.replace(/./g, (ch) => replace[ch] ?? ch);
    slug = slug.toLowerCase();
    slug = slug.replace(/[^a-z0-9\s-]/g, "");
    slug = slug.replace(/\s+/g, "-");
    slug = slug.replace(/-+/g, "-");
    return slug.replace(/^-|-$/g, "");
}

function cityKey(stateId: string, nameAscii: string) {
    return `${stateId}|${nameAscii}`;
}

function publicKey(name: string, stateId: string) {
    return `${stateId}|${asciiName(name)}`;
}

type GeoRow = {
    zip: string | null;
    zipType: "STANDARD" | "PO BOX" | "UNIQUE" | "MILITARY" | null;
    city: string | null;
    cityAscii: string | null;
    stateId: string | null;
    stateName: string | null;
    countyName: string | null;
    cityLat: string | null;
    cityLng: string | null;
    zctaLat: string | null;
    zctaLng: string | null;
    population: number | null;
    density: string | null;
    ranking: number | null;
    incorporated: boolean | null;
    timezone: string | null;
};

type CityGroup = {
    name: string;
    nameAscii: string;
    stateId: string;
    stateName: string | null;
    countyName: string | null;
    lat: string | null;
    lng: string | null;
    timezone: string | null;
    population: number | null;
    density: string | null;
    ranking: number | null;
    incorporated: boolean | null;
    zips: Array<{
        zip: string;
        zipType: GeoRow["zipType"];
        lat: string | null;
        lng: string | null;
    }>;
};

function betterRow(current: CityGroup, row: GeoRow): boolean {
    const nextPop = row.population ?? -1;
    const curPop = current.population ?? -1;
    if (nextPop !== curPop) return nextPop > curPop;

    const nextRank = row.ranking ?? 99;
    const curRank = current.ranking ?? 99;
    return nextRank < curRank;
}

async function main() {
    console.log("\n🏙  Building cities from geo_usa...\n");

    const rows = await db
        .select({
            zip: geoUsa.zip,
            zipType: geoUsa.zipType,
            city: geoUsa.city,
            cityAscii: geoUsa.cityAscii,
            stateId: geoUsa.stateId,
            stateName: geoUsa.stateName,
            countyName: geoUsa.countyName,
            cityLat: geoUsa.cityLat,
            cityLng: geoUsa.cityLng,
            zctaLat: geoUsa.zctaLat,
            zctaLng: geoUsa.zctaLng,
            population: geoUsa.population,
            density: geoUsa.density,
            ranking: geoUsa.ranking,
            incorporated: geoUsa.incorporated,
            timezone: geoUsa.timezone,
        })
        .from(geoUsa)
        .where(eq(geoUsa.isActive, true));

    if (rows.length === 0) {
        console.error("❌ geo_usa пуста. Сначала: pnpm db:geo:load\n");
        process.exit(1);
    }

    const groups = new Map<string, CityGroup>();

    for (const row of rows) {
        const name = row.city?.trim();
        const stateId = row.stateId?.trim().toUpperCase();
        if (!name || !stateId || stateId.length !== 2) continue;

        const nameAscii = asciiName(row.cityAscii?.trim() || name);
        if (!nameAscii) continue;

        const key = cityKey(stateId, nameAscii);
        const zip = row.zip?.replace(/\D/g, "").slice(0, 5) ?? "";
        const lat = row.cityLat ?? row.zctaLat;
        const lng = row.cityLng ?? row.zctaLng;

        let group = groups.get(key);
        if (!group) {
            group = {
                name,
                nameAscii,
                stateId,
                stateName: row.stateName,
                countyName: row.countyName,
                lat,
                lng,
                timezone: row.timezone,
                population: row.population,
                density: row.density,
                ranking: row.ranking,
                incorporated: row.incorporated,
                zips: [],
            };
            groups.set(key, group);
        } else if (betterRow(group, row)) {
            group.name = name;
            group.stateName = row.stateName ?? group.stateName;
            group.countyName = row.countyName ?? group.countyName;
            group.lat = lat ?? group.lat;
            group.lng = lng ?? group.lng;
            group.timezone = row.timezone ?? group.timezone;
            group.population = row.population ?? group.population;
            group.density = row.density ?? group.density;
            group.ranking = row.ranking ?? group.ranking;
            group.incorporated = row.incorporated ?? group.incorporated;
        }

        if (zip.length === 5) {
            group.zips.push({
                zip,
                zipType: row.zipType,
                lat: row.zctaLat ?? row.cityLat,
                lng: row.zctaLng ?? row.cityLng,
            });
        }
    }

    const existing = await db
        .select({
            id: cities.id,
            stateId: cities.stateId,
            nameAscii: cities.nameAscii,
            slug: cities.slug,
            isPublic: cities.isPublic,
        })
        .from(cities);

    const existingByKey = new Map(
        existing.map((row) => [cityKey(row.stateId, row.nameAscii), row])
    );
    const usedSlugs = new Set(existing.map((row) => row.slug));

    function allocateSlug(group: CityGroup): string {
        const candidates = [
            slugify(group.name),
            slugify(`${group.name} ${group.stateId}`),
            slugify(`${group.name} ${group.stateId} ${group.countyName ?? ""}`),
        ].filter(Boolean);

        for (const candidate of candidates) {
            if (!usedSlugs.has(candidate)) {
                usedSlugs.add(candidate);
                return candidate;
            }
        }

        let i = 2;
        const base = candidates[0] || `city-${group.stateId}`.toLowerCase();
        while (usedSlugs.has(`${base}-${i}`)) i += 1;
        const slug = `${base}-${i}`;
        usedSlugs.add(slug);
        return slug;
    }

    const publicSet = new Set(
        DEFAULT_PUBLIC_CITIES.map((item) => publicKey(item.name, item.stateId))
    );

    let inserted = 0;
    let updated = 0;
    const idByKey = new Map<string, number>();

    const upsertRows = [...groups.entries()].map(([key, group]) => {
        const current = existingByKey.get(key);
        if (current) updated += 1;
        else inserted += 1;

        const inStarter = publicSet.has(key);

        return {
            key,
            values: {
                name: group.name,
                nameAscii: group.nameAscii,
                stateId: group.stateId,
                stateName: group.stateName,
                slug: current?.slug ?? allocateSlug(group),
                lat: group.lat,
                lng: group.lng,
                timezone: group.timezone,
                population: group.population,
                density: group.density,
                ranking: group.ranking,
                incorporated: group.incorporated,
                countyName: group.countyName,
                isActive: inStarter,
                isPublic: inStarter,
            },
        };
    });

    for (let i = 0; i < upsertRows.length; i += ZIP_CHUNK) {
        const chunk = upsertRows.slice(i, i + ZIP_CHUNK);
        const returned = await db
            .insert(cities)
            .values(chunk.map((row) => row.values))
            .onConflictDoUpdate({
                target: [cities.stateId, cities.nameAscii],
                set: {
                    name: sql`excluded.name`,
                    stateName: sql`excluded.state_name`,
                    lat: sql`excluded.lat`,
                    lng: sql`excluded.lng`,
                    timezone: sql`excluded.timezone`,
                    population: sql`excluded.population`,
                    density: sql`excluded.density`,
                    ranking: sql`excluded.ranking`,
                    incorporated: sql`excluded.incorporated`,
                    countyName: sql`excluded.county_name`,
                    isActive: sql`excluded.is_active`,
                    isPublic: sql`excluded.is_public`,
                    updatedAt: sql`now()`,
                },
            })
            .returning({
                id: cities.id,
                stateId: cities.stateId,
                nameAscii: cities.nameAscii,
            });

        for (const row of returned) {
            idByKey.set(cityKey(row.stateId, row.nameAscii), row.id);
        }
    }

    const activeIds = [...idByKey.values()];
    if (activeIds.length > 0) {
        await db
            .update(cities)
            .set({ isActive: false, updatedAt: sql`now()` })
            .where(
                sql`${cities.id} not in (${sql.join(
                    activeIds.map((id) => sql`${id}`),
                    sql`, `
                )})`
            );
    }

    await db.delete(cityZips);

    const zipRows: Array<{
        cityId: number;
        zip: string;
        zipType: GeoRow["zipType"];
        lat: string | null;
        lng: string | null;
        isPrimary: boolean;
    }> = [];
    const seenZips = new Set<string>();

    for (const [key, group] of groups) {
        const cityId = idByKey.get(key);
        if (!cityId) continue;

        let primaryZip: string | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        const cityLat = group.lat ? Number(group.lat) : null;
        const cityLng = group.lng ? Number(group.lng) : null;

        for (const item of group.zips) {
            if (cityLat == null || cityLng == null || item.lat == null || item.lng == null) {
                continue;
            }
            const dist =
                (Number(item.lat) - cityLat) ** 2 + (Number(item.lng) - cityLng) ** 2;
            if (dist < bestDist) {
                bestDist = dist;
                primaryZip = item.zip;
            }
        }
        if (!primaryZip && group.zips[0]) primaryZip = group.zips[0].zip;

        for (const item of group.zips) {
            if (seenZips.has(item.zip)) continue;
            seenZips.add(item.zip);
            zipRows.push({
                cityId,
                zip: item.zip,
                zipType: item.zipType,
                lat: item.lat,
                lng: item.lng,
                isPrimary: item.zip === primaryZip,
            });
        }
    }

    for (let i = 0; i < zipRows.length; i += ZIP_CHUNK) {
        await db.insert(cityZips).values(zipRows.slice(i, i + ZIP_CHUNK));
    }

    const backfill = await db.execute(sql`
        update companies as c
        set city_id = ci.id,
            updated_at = now()
        from cities as ci
        where c.city_id is null
          and c.s_city is not null
          and lower(c.s_city) = lower(ci.name || ' ' || ci.state_id)
    `);

    const publicCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cities)
        .where(and(eq(cities.isPublic, true), eq(cities.isActive, true)));

    console.log(`Гео-строк прочитано:     ${rows.length}`);
    console.log(`Городов собрано:         ${groups.size}`);
    console.log(`Городов создано:         ${inserted}`);
    console.log(`Городов обновлено:       ${updated}`);
    console.log(`ZIP-связей:              ${zipRows.length}`);
    console.log(`Компаний привязано:      ${Number((backfill as { count?: number }).count ?? 0) || "см. UPDATE"}`);
    console.log(`Публичных городов:       ${publicCount[0]?.count ?? 0}\n`);
    console.log("✓ cities / city_zips готовы\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ db:geo:build-cities failed:", err);
    process.exit(1);
});
