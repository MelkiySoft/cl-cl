import "dotenv/config";
import { asc, desc, isNotNull, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { geoUsa } from "@/db/schema";

function slugify(input: string): string {
    const replace: Record<string, string> = {
        á: "a", à: "a", â: "a", ã: "a", ä: "a", å: "a", æ: "ae",
        é: "e", è: "e", ê: "e", ë: "e",
        í: "i", ì: "i", î: "i", ï: "i",
        ó: "o", ò: "o", ô: "o", õ: "o", ö: "o", ø: "o", œ: "oe",
        ú: "u", ù: "u", û: "u", ü: "u",
        ñ: "n", ç: "c", ý: "y", ÿ: "y", ß: "ss",
        Á: "A", À: "A", Â: "A", Ã: "A", Ä: "A", Å: "A", Æ: "AE",
        É: "E", È: "E", Ê: "E", Ë: "E",
        Í: "I", Ì: "I", Î: "I", Ï: "I",
        Ó: "O", Ò: "O", Ô: "O", Õ: "O", Ö: "O", Ø: "O", Œ: "OE",
        Ú: "U", Ù: "U", Û: "U", Ü: "U",
        Ñ: "N", Ç: "C", Ý: "Y", Ÿ: "Y",
    };

    let slug = input.replace(/./g, (ch) => replace[ch] ?? ch);
    slug = slug.toLowerCase();
    slug = slug.replace(/[^a-z0-9\s-]/g, "");
    slug = slug.replace(/\s+/g, "-");
    slug = slug.replace(/-+/g, "-");
    return slug.replace(/^-|-$/g, "");
}

async function main() {
    console.log("\n🔗 Генерация slug...\n");

    const rows = await db
        .select({
            id: geoUsa.id,
            city: geoUsa.city,
            alternateCities: geoUsa.alternateCities,
            slug: geoUsa.slug,
            stateId: geoUsa.stateId,
            countyName: geoUsa.countyName,
            population: geoUsa.population,
        })
        .from(geoUsa)
        .orderBy(desc(geoUsa.population));

    // счётчики уникальности
    const csc: Record<string, number> = {};
    const cs: Record<string, number> = {};
    const cc: Record<string, number> = {};
    const cp: Record<string, number> = {};
    const c: Record<string, number> = {};

    for (const item of rows) {
        const city = item.city ?? "";
        const state = item.stateId ?? "";
        const county = item.countyName ?? "";
        const population = item.population ?? 0;

        const keyCsc = `${city}|${state}|${county}`;
        const keyCs = `${city}|${state}`;
        const keyCc = `${city}|${county}`;
        const keyCp = `${city}|${population}`;
        const keyC = city;

        csc[keyCsc] = (csc[keyCsc] ?? 0) + 1;
        cs[keyCs] = (cs[keyCs] ?? 0) + 1;
        cc[keyCc] = (cc[keyCc] ?? 0) + 1;
        cp[keyCp] = (cp[keyCp] ?? 0) + 1;
        c[keyC] = (c[keyC] ?? 0) + 1;
    }

    let processed = 0;
    let skippedChange = 0;
    let skippedEmpty = 0;

    for (const item of rows) {
        const id = item.id;
        const city = item.city ?? "";
        const state = item.stateId ?? "";
        const county = item.countyName ?? "";
        const population = item.population ?? 0;
        const oldSlug = item.slug;

        const keyCsc = `${city}|${state}|${county}`;
        const keyCs = `${city}|${state}`;
        const keyCc = `${city}|${county}`;
        const keyCp = `${city}|${population}`;
        const keyC = city;

        let raw: string;

        if (c[keyC] === 1) {
            raw = city;
        } else if (
            c[keyC] === cs[keyCs] &&
            population > 0 &&
            c[keyC] === cp[keyCp]
        ) {
            raw = city;
        } else if (c[keyC] === cs[keyCs] && c[keyC] !== cc[keyCc]) {
            raw = `${city} ${county}`;
        } else if (c[keyC] !== cs[keyCs] && c[keyC] === cc[keyCc]) {
            raw = `${city} ${state}`;
        } else if (c[keyC] !== cs[keyCs] && c[keyC] !== cc[keyCc]) {
            if (c[keyC] * 0.7 < (csc[keyCsc] ?? 0)) {
                raw = city;
            } else {
                raw = `${city} ${state} ${county}`;
            }
        } else {
            raw = `${city} ${state} ${county}`;
        }

        const slug = slugify(raw);

        if (oldSlug && oldSlug !== "" && oldSlug !== slug) {
            console.log(
                `ВНИМАНИЕ: slug хочет измениться! ID: ${id} | '${city}' | old: '${oldSlug}' | new: '${slug}'`
            );
            skippedChange++;
            continue; // как в PHP — не перезаписываем без явного решения
        }

        if (!slug) {
            console.log(
                `ВНИМАНИЕ: slug пустой! ID: ${id} | '${city}' | old: '${oldSlug}'`
            );
            skippedEmpty++;
            continue;
        }

        await db
            .update(geoUsa)
            .set({ slug, updatedAt: sql`now()` })
            .where(sql`${geoUsa.id} = ${id}`);

        processed++;
        if (processed % 5000 === 0) {
            process.stdout.write(`  → Обновлено: ${processed}\r`);
        }
    }

    const unique = await db
        .select({ count: sql<number>`count(DISTINCT ${geoUsa.slug})` })
        .from(geoUsa)
        .where(sql`${geoUsa.slug} IS NOT NULL AND ${geoUsa.slug} != ''`);

    const empty = await db
        .select({ count: sql<number>`count(*)` })
        .from(geoUsa)
        .where(sql`${geoUsa.slug} IS NULL OR ${geoUsa.slug} = ''`);

    console.log(`\nГенерация slug завершена: ${processed} строк обновлено.`);
    console.log(`Пропущено (хотели изменить): ${skippedChange}`);
    console.log(`Пропущено (пустой slug):     ${skippedEmpty}`);
    console.log(`Уникальных slug:             ${unique[0]?.count ?? 0}`);
    console.log(`Пустых/null slug:            ${empty[0]?.count ?? 0}\n`);

    process.exit(0);
}

main().catch((err) => {
    console.error("❌ generate-slugs failed:", err);
    process.exit(1);
});