export type AttributeType = "boolean" | "number" | "select" | "multiselect";

export type AttributeValueDefinition = {
    id: number;
    name: string;
    sortOrder: number;
};

export type AttributeDefinition = {
    id: number;
    name: string;
    type: AttributeType;
    filterable: boolean;
    sortOrder: number;
    values: AttributeValueDefinition[];
};

export type CompanyAttributeInput = {
    attributeId: number;
    booleanValue: boolean | null;
    numberValue: number | null;
    valueIds: number[];
};

export type CompanyAttributeDisplay = {
    attributeId: number;
    name: string;
    type: AttributeType;
    values: string[];
};

export type CompanyAttributeRow = {
    companyId: number;
    attributeId: number;
    valueId: number | null;
    valueBoolean: boolean | null;
    valueNumber: number | null;
};

export function emptyAttributeInput(attributeId: number): CompanyAttributeInput {
    return {
        attributeId,
        booleanValue: null,
        numberValue: null,
        valueIds: [],
    };
}

export function emptyAttributeInputs(
    defs: AttributeDefinition[]
): CompanyAttributeInput[] {
    return defs.map((def) => emptyAttributeInput(def.id));
}

export function rowsToAttributeInputs(
    defs: AttributeDefinition[],
    rows: {
        attributeId: number;
        valueId: number | null;
        valueBoolean: boolean | null;
        valueNumber: number | null;
    }[]
): CompanyAttributeInput[] {
    const byAttribute = new Map<number, typeof rows>();
    for (const row of rows) {
        const list = byAttribute.get(row.attributeId) ?? [];
        list.push(row);
        byAttribute.set(row.attributeId, list);
    }

    return defs.map((def) => {
        const current = byAttribute.get(def.id) ?? [];
        if (def.type === "boolean") {
            return {
                ...emptyAttributeInput(def.id),
                booleanValue: current[0]?.valueBoolean ?? null,
            };
        }
        if (def.type === "number") {
            return {
                ...emptyAttributeInput(def.id),
                numberValue: current[0]?.valueNumber ?? null,
            };
        }
        return {
            ...emptyAttributeInput(def.id),
            valueIds: current
                .map((row) => row.valueId)
                .filter((id): id is number => typeof id === "number"),
        };
    });
}

export function attributeRowsToDisplay(
    defs: AttributeDefinition[],
    rows: {
        attributeId: number;
        valueId: number | null;
        valueBoolean: boolean | null;
        valueNumber: number | null;
    }[]
): CompanyAttributeDisplay[] {
    const inputs = rowsToAttributeInputs(defs, rows);
    const defMap = new Map(defs.map((def) => [def.id, def]));
    const result: CompanyAttributeDisplay[] = [];

    for (const input of inputs) {
        const def = defMap.get(input.attributeId);
        if (!def) continue;

        if (def.type === "boolean") {
            if (input.booleanValue === null) continue;
            result.push({
                attributeId: def.id,
                name: def.name,
                type: def.type,
                values: [input.booleanValue ? "Yes" : "No"],
            });
            continue;
        }

        if (def.type === "number") {
            if (input.numberValue === null) continue;
            result.push({
                attributeId: def.id,
                name: def.name,
                type: def.type,
                values: [String(input.numberValue)],
            });
            continue;
        }

        const allowed = new Map(def.values.map((value) => [value.id, value.name]));
        const names = input.valueIds
            .map((id) => allowed.get(id))
            .filter((name): name is string => Boolean(name));
        if (names.length === 0) continue;

        result.push({
            attributeId: def.id,
            name: def.name,
            type: def.type,
            values: names,
        });
    }

    return result;
}

export function attributeInputsToRows(
    companyId: number,
    defs: AttributeDefinition[],
    inputs: CompanyAttributeInput[]
): { rows: CompanyAttributeRow[] } | { error: string } {
    const defMap = new Map(defs.map((def) => [def.id, def]));
    const rows: CompanyAttributeRow[] = [];

    for (const input of inputs) {
        const def = defMap.get(input.attributeId);
        if (!def) {
            return { error: "Unknown attribute" };
        }

        if (def.type === "boolean") {
            if (input.booleanValue === null) continue;
            rows.push({
                companyId,
                attributeId: def.id,
                valueId: null,
                valueBoolean: input.booleanValue,
                valueNumber: null,
            });
            continue;
        }

        if (def.type === "number") {
            if (input.numberValue === null) continue;
            rows.push({
                companyId,
                attributeId: def.id,
                valueId: null,
                valueBoolean: null,
                valueNumber: input.numberValue,
            });
            continue;
        }

        const allowed = new Set(def.values.map((value) => value.id));
        const uniqueIds = [...new Set(input.valueIds)];

        for (const valueId of uniqueIds) {
            if (!allowed.has(valueId)) {
                return { error: `Invalid value for ${def.name}` };
            }
        }

        if (def.type === "select" && uniqueIds.length > 1) {
            return { error: `${def.name} accepts one value` };
        }

        for (const valueId of uniqueIds) {
            rows.push({
                companyId,
                attributeId: def.id,
                valueId,
                valueBoolean: null,
                valueNumber: null,
            });
        }
    }

    return { rows };
}
