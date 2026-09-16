import { readFileSync } from "node:fs";
import { parseXml } from "./companies-xml-parse";

export type RawCompanyRow = {
    externalId: string;
    name: string;
    website: string;
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

function cell(row: Record<string, string>, ...names: string[]): string {
    for (const name of names) {
        const value = row[name];
        if (value !== undefined) return value;
    }
    return "";
}

function cellsByHeader(row: Record<string, string>, header: string): string[] {
    const values: string[] = [];
    const prefix = `${header}#`;
    for (const [key, value] of Object.entries(row)) {
        if (key === header || key.startsWith(prefix)) {
            const trimmed = value.trim();
            if (trimmed) values.push(trimmed);
        }
    }
    return values;
}

export function loadCompaniesXml(filePath: string): RawCompanyRow[] {
    const xml = readFileSync(filePath, "utf8");
    const table = parseXml(xml);

    return table.map((row) => ({
        externalId: cell(row, "external_id").trim(),
        name: cell(row, "Название").trim(),
        website: cell(row, "Сайт").trim(),
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
        categories: cellsByHeader(row, "Категория"),
        serviceCity: cell(row, "Главный город и штат").trim(),
        serviceZips: cell(row, "Зона обслуживания ZIP").trim(),
        serviceArea: cell(row, "Зона обслуживания Area").trim(),
        languages: cell(row, "Languages").trim(),
        paymentMethods: cell(row, "Payment methods").trim(),
        yearsInBusiness: cell(row, "Years in business").trim(),
        insuranceStatus: cell(row, "Insurance status").trim(),
        ecoFriendly: cell(row, "Eco-friendly products").trim(),
        teamSize: cell(row, "Team size").trim(),
        cancellationPolicy: cell(row, "Cancellation policy").trim(),
        sameDayBooking: cell(row, "Same-day booking").trim(),
        franchiseAffiliation: cell(row, "Franchise affiliation").trim(),
        serviceGuarantee: cell(row, "Service guarantee").trim(),
        owned: cell(row, "Owned").trim(),
    }));
}
