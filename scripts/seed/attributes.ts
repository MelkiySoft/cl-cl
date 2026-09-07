import { sql } from "drizzle-orm";

import { db } from "@/db";
import { attributes, attributeValues } from "@/db/schema";
import { ATTRIBUTE_SEEDS, ATTRIBUTE_VALUE_SEEDS } from "@/lib/attributes";

async function resetSerial(table: "attributes" | "attribute_values") {
    await db.execute(
        sql.raw(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`
        )
    );
}

export async function seedAttributes() {
    console.log("→ Seeding attributes...");

    await db.insert(attributes).values(
        ATTRIBUTE_SEEDS.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            filterable: row.filterable,
            sortOrder: row.sortOrder,
            status: true,
        }))
    );

    await db.insert(attributeValues).values(
        ATTRIBUTE_VALUE_SEEDS.map((row) => ({
            id: row.id,
            attributeId: row.attributeId,
            name: row.name,
            sortOrder: row.sortOrder,
            status: true,
        }))
    );

    await resetSerial("attributes");
    await resetSerial("attribute_values");

    console.log(
        `✓ Attributes seeded (${ATTRIBUTE_SEEDS.length} attributes, ${ATTRIBUTE_VALUE_SEEDS.length} values)\n`
    );
}
