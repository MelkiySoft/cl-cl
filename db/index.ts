import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function requireDatabaseUrl(): string {
    const value = process.env.DATABASE_URL;
    if (!value) {
        throw new Error("DATABASE_URL is not set");
    }
    return value;
}

const connectionString: string = requireDatabaseUrl();

const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isNeonPooler =
    connectionString.includes("-pooler.") ||
    connectionString.includes("pgbouncer=true");

/**
 * Next build поднимает несколько воркеров, каждый импортирует этот модуль
 * и создаёт свой пул. Дефолт postgres.js — max: 10. При 11 воркерах это
 * до 110 соединений → ECONNRESET / too many clients на локальном Postgres
 * и на Neon/PgBouncer.
 *
 * На build и на pooler держим 1 соединение на процесс.
 */
const maxConnections = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
const max =
    Number.isFinite(maxConnections) && maxConnections > 0
        ? maxConnections
        : isBuild || isNeonPooler
            ? 1
            : 3;

const globalForDb = globalThis as unknown as {
    pg: ReturnType<typeof postgres> | undefined;
};

function createClient() {
    return postgres(connectionString, {
        prepare: false,
        max,
        idle_timeout: 20,
        connect_timeout: 10,
        max_lifetime: 60 * 30,
    });
}

const client = globalForDb.pg ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalForDb.pg = client;
}

export const db = drizzle(client, { schema });
