import { sql } from "drizzle-orm";

import { db } from "@/db";

const KEEP_TABLES = ["geo_usa", "cities", "city_zips"] as const;

/**
 * Все таблицы public, кроме geo-справочника и собранных городов.
 * Список app-таблиц не храним в коде — иначе каждая новая таблица забывается в TRUNCATE.
 */
function rowsOf<T extends Record<string, unknown>>(result: unknown): T[] {
    if (Array.isArray(result)) return result as T[];
    if (
        result &&
        typeof result === "object" &&
        "rows" in result &&
        Array.isArray((result as { rows: unknown }).rows)
    ) {
        return (result as { rows: T[] }).rows;
    }
    throw new Error("Unexpected db.execute() result shape");
}

async function appTableNames(): Promise<string[]> {
    const keep = sql.join(
        KEEP_TABLES.map((name) => sql`${name}`),
        sql`, `
    );

    const result = await db.execute(sql`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename not in (${keep})
        ORDER BY tablename
    `);

    return rowsOf<{ tablename: string }>(result).map((row) => row.tablename);
}

function quoteIdent(name: string) {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
        throw new Error(`Unexpected table name: ${name}`);
    }
    return `"${name}"`;
}

function qualifiedList(tables: string[]) {
    return sql.join(
        tables.map((name) => sql.raw(`public.${quoteIdent(name)}`)),
        sql`, `
    );
}

export async function dropAppTables() {
    const tables = await appTableNames();

    if (tables.length === 0) {
        console.log("→ No app tables to drop");
        return;
    }

    console.log(
        `→ Dropping ${tables.length} tables (keeping ${KEEP_TABLES.join(", ")})...`
    );
    await db.execute(sql`DROP TABLE IF EXISTS ${qualifiedList(tables)} CASCADE`);
    console.log("✓ App tables dropped\n");
}

export async function truncateAppTables() {
    const tables = await appTableNames();

    if (tables.length === 0) {
        console.log("→ No app tables to truncate");
        return;
    }

    console.log(
        `→ Truncating ${tables.length} tables (keeping ${KEEP_TABLES.join(", ")})...`
    );
    await db.execute(
        sql`TRUNCATE TABLE ${qualifiedList(tables)} RESTART IDENTITY CASCADE`
    );
    console.log("✓ App tables truncated\n");
}
