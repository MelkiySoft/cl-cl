import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { attributes, attributeValues, companyAttributes } from "@/db/schema";
import type { AttributeDefinition, CompanyAttributeRow } from "@/lib/company-attributes";

export async function getActiveAttributeDefinitions(): Promise<
    AttributeDefinition[]
> {
    const rows = await db.query.attributes.findMany({
        where: eq(attributes.status, true),
        orderBy: [asc(attributes.sortOrder), asc(attributes.id)],
        with: {
            values: {
                where: eq(attributeValues.status, true),
                orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)],
                columns: {
                    id: true,
                    name: true,
                    sortOrder: true,
                },
            },
        },
    });

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        filterable: row.filterable,
        sortOrder: row.sortOrder,
        values: row.values,
    }));
}

export async function replaceCompanyAttributeRows(
    companyId: number,
    rows: CompanyAttributeRow[]
) {
    await db
        .delete(companyAttributes)
        .where(eq(companyAttributes.companyId, companyId));

    if (rows.length === 0) return;

    await db.insert(companyAttributes).values(rows);
}

export async function getCompanyAttributeRows(companyId: number) {
    return db.query.companyAttributes.findMany({
        where: eq(companyAttributes.companyId, companyId),
        columns: {
            attributeId: true,
            valueId: true,
            valueBoolean: true,
            valueNumber: true,
        },
    });
}
