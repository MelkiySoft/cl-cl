import { readFileSync } from "node:fs";
import { sanitizeImportText } from "./companies-map";
import { parseXmlTable } from "./companies-xml-parse";

export type RawCompanyRow = {
    externalId: string;
    name: string;
    website: string;
    googleMaps: string;
    yelp: string;
    address: string;
    hqZip: string;
    phone: string;
    hours: string;
    email: string;
    logo: string;
    photos: string[];
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
    linkedin: string;
    categories: string[];
    serviceCity: string;
    serviceZips: string;
    serviceArea: string;
    languages: string;
    paymentMethods: string;
    yearsInBusiness: string;
    insuranceStatus: string;
    ecoFriendly: string;
    teamSize: string;
    cancellationPolicy: string;
    sameDayBooking: string;
    franchiseAffiliation: string;
    serviceGuarantee: string;
    owned: string;
};

const PHOTO_HEADERS = ["foto1", "foto2", "foto3", "foto4", "foto5"] as const;

const ATTR_KEYS = [
    "Зона обслуживания ZIP",
    "Зона обслуживания Area",
    "Languages",
    "Payment methods",
    "Years in business",
    "Insurance status",
    "Eco-friendly products",
    "Team size",
    "Cancellation policy",
    "Same-day booking",
    "Franchise affiliation",
    "Service guarantee",
    "Owned",
] as const;

type AttrKey = (typeof ATTR_KEYS)[number];

function cell(row: Record<string, string>, ...names: string[]): string {
    for (const name of names) {
        const value = row[name];
        if (value !== undefined) return sanitizeImportText(value);
    }
    return "";
}

function headerBase(header: string): string {
    return header.replace(/#\d+$/, "");
}

function cellsByHeader(row: Record<string, string>, header: string): string[] {
    const values: string[] = [];
    const prefix = `${header}#`;
    for (const [key, value] of Object.entries(row)) {
        if (key === header || key.startsWith(prefix)) {
            const trimmed = sanitizeImportText(value).trim();
            if (trimmed) values.push(trimmed);
        }
    }
    return values;
}

function isNewPriceFormat(
    row: Record<string, string>,
    headersByCol: Map<number, string>
): boolean {
    if (cell(row, "Х-ка").trim()) return true;
    if (cell(row, "Главная (младшая) категория").trim()) return true;
    if (cell(row, "Google Business1").trim()) return true;
    for (const header of headersByCol.values()) {
        const base = headerBase(header);
        if (base === "Х-ка" || base === "Главная (младшая) категория") return true;
        if (header === "Google Business1") return true;
    }
    return false;
}

function collectCategories(
    row: Record<string, string>,
    pairedFormat: boolean
): string[] {
    if (pairedFormat) {
        return [
            ...cellsByHeader(row, "Главная (младшая) категория"),
            ...cellsByHeader(row, "Категория дочерная"),
        ];
    }
    return cellsByHeader(row, "Категория");
}

/**
 * В новом прайсе характеристики идут парами колонок:
 * «Х-ка» + следующая колонка («Значение ZIP» / «Значение районы…» / «Значение»).
 * Неизвестные пары отбрасываем.
 */
function collectPairedAttributes(
    cols: Map<number, string>,
    headersByCol: Map<number, string>
): Partial<Record<AttrKey, string>> {
    const known = new Map<string, AttrKey>(
        ATTR_KEYS.map((name) => [name.toLowerCase(), name])
    );
    const out: Partial<Record<AttrKey, string>> = {};
    const columns = [...headersByCol.keys()].sort((a, b) => a - b);

    for (let i = 0; i < columns.length; i += 1) {
        const col = columns[i];
        const header = headersByCol.get(col);
        if (!header || headerBase(header) !== "Х-ка") continue;

        const rawName = sanitizeImportText(cols.get(col) ?? "").trim();
        if (!rawName) continue;

        const nextCol = columns[i + 1];
        const nextHeader = nextCol !== undefined ? headersByCol.get(nextCol) : undefined;
        const nextIsValue =
            nextHeader !== undefined && headerBase(nextHeader).startsWith("Значение");
        let rawValue = nextIsValue
            ? sanitizeImportText(cols.get(nextCol) ?? "").trim()
            : "";

        const segments = rawName
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean);
        const name = segments[0] ?? "";
        if (!rawValue && segments.length > 1) {
            rawValue = segments.slice(1).join(";");
        }

        const key = known.get(name.toLowerCase());
        if (!key) continue;
        if (rawValue) out[key] = rawValue;
        else if (out[key] === undefined) out[key] = "";
    }

    return out;
}

export function loadCompaniesXml(filePath: string): RawCompanyRow[] {
    const xml = readFileSync(filePath, "utf8");
    const table = parseXmlTable(xml);

    return table.rows.map((row, index) => {
        const pairedFormat = isNewPriceFormat(row, table.headersByCol);
        const pairs = pairedFormat
            ? collectPairedAttributes(table.rowCols[index], table.headersByCol)
            : {};

        const pick = (key: AttrKey, oldHeader: string): string => {
            if (pairedFormat) return pairs[key] ?? "";
            return cell(row, oldHeader).trim();
        };

        return {
            externalId: cell(row, "external_id").trim(),
            name: cell(row, "Название").trim(),
            website: cell(row, "Сайт").trim(),
            // Google Business (g.co) не заливаем. Google Business1 → Google Maps.
            googleMaps: cell(row, "Google Business1").trim(),
            yelp: cell(row, "Yelp").trim(),
            address: cell(row, "Главный адрес").trim(),
            hqZip: cell(row, "ZIP офиса").trim(),
            phone: cell(row, "Phone").trim(),
            hours: cell(row, "График").trim(),
            email: cell(row, "Email").trim(),
            logo: cell(row, "Logo").trim(),
            photos: PHOTO_HEADERS.map((h) => cell(row, h).trim()).filter(Boolean),
            facebook: cell(row, "facebook").trim(),
            instagram: cell(row, "instagram").trim(),
            youtube: cell(row, "youtube").trim(),
            twitter: cell(row, "twitter").trim(),
            linkedin: cell(row, "linkedin").trim(),
            categories: collectCategories(row, pairedFormat),
            serviceCity: pairedFormat
                ? cell(row, "Категория").trim()
                : cell(row, "Главный город и штат").trim(),
            serviceZips: pick("Зона обслуживания ZIP", "Зона обслуживания ZIP"),
            serviceArea: pick("Зона обслуживания Area", "Зона обслуживания Area"),
            languages: pick("Languages", "Languages"),
            paymentMethods: pick("Payment methods", "Payment methods"),
            yearsInBusiness: pick("Years in business", "Years in business"),
            insuranceStatus: pick("Insurance status", "Insurance status"),
            ecoFriendly: pick("Eco-friendly products", "Eco-friendly products"),
            teamSize: pick("Team size", "Team size"),
            cancellationPolicy: pick("Cancellation policy", "Cancellation policy"),
            sameDayBooking: pick("Same-day booking", "Same-day booking"),
            franchiseAffiliation: pick(
                "Franchise affiliation",
                "Franchise affiliation"
            ),
            serviceGuarantee: pick("Service guarantee", "Service guarantee"),
            owned: pick("Owned", "Owned"),
        };
    });
}
