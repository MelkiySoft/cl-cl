import type { CompanyLinkType, HoursMode } from "@/db/schema";

const CATEGORY_ALIASES: Array<[string, string]> = [
    ["House cleaning", "house-cleaning"],
    ["Deep cleaning", "deep-cleaning"],
    ["Move-out / Move-in Cleaning", "move-out-in-cleaning"],
    ["Move out/in cleaning", "move-out-in-cleaning"],
    ["Move out cleaning", "move-out-in-cleaning"],
    ["Move in cleaning", "move-out-in-cleaning"],
    ["Regular cleaning", "regular-cleaning"],
    ["Green Cleaning", "green-cleaning"],
    ["Hoarder cleaning", "hoarder-cleaning"],
    ["Airbnb cleaning", "airbnb-cleaning"],
    ["Commercial cleaning", "commercial-cleaning"],
    ["Office cleaning", "office-cleaning"],
    ["Educational Facility Cleaning", "educational-facility-cleaning"],
    ["Retail Store Cleaning", "retail-store-cleaning"],
    ["Industrial Cleaning", "industrial-cleaning"],
    ["Medical Facility Cleaning", "medical-facility-cleaning"],
    ["Restaurant Cleaning", "restaurant-cleaning"],
    ["Janitorial cleaning", "janitorial-cleaning"],
    ["post construction cleaning", "post-construction-cleaning"],
    ["post constraction cleaning", "post-construction-cleaning"],
    ["Maid service", "maid-service"],
    ["Maid Service (house keeping)", "maid-service"],
    ["Housekeeping", "maid-service"],
    ["Upholstery cleaning", "upholstery-cleaning"],
    ["Air duct cleaning", "air-duct-cleaning"],
    ["Mold Remediation", "mold-remediation"],
    ["Mold Removal", "mold-remediation"],
    ["Pest Control", "pest-control"],
    ["Pool cleaning", "pool-cleaning"],
    ["Cleaning outside", "cleaning-outside"],
    ["Exterior Cleaning", "cleaning-outside"],
    ["Window Cleaning", "window-cleaning"],
    ["Windows Cleaning", "window-cleaning"],
    ["Pressure Washing", "pressure-washing"],
    ["Gutter Cleaning", "gutter-cleaning"],
    ["Vehicle & Equipment Cleaning", "vehicle-equipment-cleaning"],
    ["Vehicle Cleaning", "vehicle-equipment-cleaning"],
    ["Equipment Cleaning", "vehicle-equipment-cleaning"],
    ["Junk Removal", "junk-removal"],
    ["Sewer Cleaning", "sewer-cleaning"],
    ["Laundry", "laundry"],
    ["Dry Cleaning", "dry-cleaning"],
];

export const CATEGORY_SLUG_BY_NAME: Record<string, string> = Object.fromEntries(
    CATEGORY_ALIASES.map(([from, slug]) => [normKey(from), slug])
);

const SILENT_IGNORED_CATEGORIES = new Set(
    [
        "Resedential cleaning",
        "Residential cleaning",
        "Apartment cleaning",
        "Disinfection Services",
        "Biohazard cleaning",
        "Homicide Cleanup",
    ].map(normKey)
);

const LANGUAGE_MAP: Record<string, string> = {
    english: "English",
    englis: "English",
    spanish: "Spanish",
    mexican: "Spanish",
    polish: "Polish",
    ukrainian: "Ukrainian",
    italian: "Italian",
    italiano: "Italian",
    "asl proficient": "ASL proficient",
    asl: "ASL proficient",
};

const PAYMENT_IGNORE = new Set([
    "invoice",
    "online payment",
    "oac",
    "nequi",
    "bre-b",
    "bancolombia",
    "daviplata",
    "davivienda",
    "credit",
    "chase quick",
    "chase pay",
    "quick pay",
    "quickpay",
    "free bank transfers",
    "digital wallet",
    "mobile payment",
]);

const PAYMENT_MAP: Record<string, string> = {
    cash: "Cash",
    "credit card": "Credit Card",
    "credit cards": "Credit Card",
    "all major credit cards": "Credit Card",
    visa: "Credit Card",
    mastercard: "Credit Card",
    "american express": "Credit Card",
    amex: "Credit Card",
    discover: "Credit Card",
    jcb: "Credit Card",
    unionpay: "Credit Card",
    debit: "Credit Card",
    check: "Check",
    checks: "Check",
    chek: "Check",
    сheck: "Check",
    chack: "Check",
    zelle: "Zelle",
    zell: "Zelle",
    venmo: "Venmo",
    paypal: "PayPal",
    "apple pay": "Apple Pay",
    "google pay": "Google Pay",
    "android pay": "Google Pay",
    "google wallet": "Google Pay",
    "samsung pay": "Samsung Pay",
    cryptocurrency: "Cryptocurrency",
};

const OWNED_MAP: Record<string, string> = {
    women: "Women",
    family: "Family",
    latinx: "Latinx",
    asian: "Asian",
    black: "Black",
    veteran: "Veteran",
    lgbtq: "LGBTQ",
    locally: "Locally",
    disabled: "Disabled",
    disability: "Disabled",
    indigenous: "Indigenous",
    minority: "Minority",
    minoryti: "Minority",
};

const CANCEL_MAP: Record<string, string> = {
    "24-hour notice required": "24-hour notice required",
    "24 hour": "24-hour notice required",
    "24h": "24-hour notice required",
    "48-hour notice required": "48-hour notice required",
    "48 hour": "48-hour notice required",
    "48h": "48-hour notice required",
    "72-hour notice required": "72-hour notice required",
    "72 hour": "72-hour notice required",
    "72h": "72-hour notice required",
};

const STATE_BY_NAME: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
    "district of columbia": "DC",
};

const STREET_SUFFIX =
    "ave|avenue|st|street|rd|road|dr|drive|blvd|boulevard|pkwy|parkway|ln|lane|ct|court|way|hwy|highway|pl|place|cir|circle|trl|trail|ter|terrace";

export function normKey(value: string): string {
    return value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9\u0400-\u04ff+]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

export function compactKey(value: string): string {
    return normKey(value).replace(/\s+/g, "");
}

export function splitList(value: string): string[] {
    return value
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
}

export function unique(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
        const key = normKey(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(value);
    }
    return out;
}

export function mapCategoryName(raw: string): string | null {
    return CATEGORY_SLUG_BY_NAME[normKey(raw)] ?? null;
}

export function isSilentIgnoredCategory(raw: string): boolean {
    return SILENT_IGNORED_CATEGORIES.has(normKey(raw));
}

export function mapLanguages(raw: string): string[] {
    return unique(
        splitList(raw)
            .map((token) => LANGUAGE_MAP[normKey(token)])
            .filter((v): v is string => Boolean(v))
    );
}

export function mapPayments(raw: string): { values: string[]; ignored: string[] } {
    const values: string[] = [];
    const ignored: string[] = [];
    for (const token of splitList(raw)) {
        const key = normKey(token);
        if (!key) continue;
        if (PAYMENT_IGNORE.has(key)) {
            ignored.push(token);
            continue;
        }
        const mapped = PAYMENT_MAP[key];
        if (mapped) values.push(mapped);
        else ignored.push(token);
    }
    return { values: unique(values), ignored };
}

export function mapOwned(raw: string): string[] {
    return unique(
        splitList(raw)
            .map((token) => OWNED_MAP[normKey(token)])
            .filter((v): v is string => Boolean(v))
    );
}

export function mapCancellation(raw: string): string | null {
    const key = normKey(raw);
    if (!key) return null;
    if (CANCEL_MAP[key]) return CANCEL_MAP[key];
    if (key.includes("24")) return "24-hour notice required";
    if (key.includes("48")) return "48-hour notice required";
    if (key.includes("72")) return "72-hour notice required";
    return null;
}

export function mapBooleanYes(raw: string): boolean | null {
    const key = normKey(raw);
    if (!key) return null;
    if (key === "yes" || key === "true" || key === "1") return true;
    return null;
}

export function mapBooleanYesNo(raw: string): boolean | null {
    const key = normKey(raw);
    if (!key) return null;
    if (key === "yes" || key === "true" || key === "1") return true;
    if (key === "no" || key === "false" || key === "0") return false;
    return null;
}

export function mapInsured(raw: string): boolean | null {
    const key = normKey(raw);
    if (!key) return null;
    if (key === "insured" || key === "yes" || key === "true" || key === "1") return true;
    return null;
}

export function mapYearFounded(raw: string, now = new Date()): number | null {
    const match = raw.trim().match(/^(\d+)\s*years?$/i);
    if (!match) return null;
    const years = Number(match[1]);
    if (!Number.isFinite(years) || years <= 0 || years > 200) return null;
    return now.getFullYear() - years;
}

export function mapTeamSize(raw: string): number | null {
    const match = raw.trim().match(/^(\d+)$/);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function isValidZip(raw: string): boolean {
    return /^\d{5}$/.test(raw.trim());
}

export function parseZipList(raw: string): string[] {
    return unique(
        raw
            .split(/[;,\s]+/)
            .map((part) => part.trim())
            .filter(isValidZip)
    );
}

export function normalizeState(raw: string): string | null {
    const key = normKey(raw);
    if (!key) return null;
    if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
    return STATE_BY_NAME[key] ?? null;
}

export function parseCityState(raw: string): { city: string; state: string } | null {
    const cleaned = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) return null;
    const match = cleaned.match(/^(.*?)[\s,]+([A-Za-z]{2})$/);
    if (!match) return null;
    const city = titleCity(match[1]);
    const state = normalizeState(match[2]);
    if (!city || !state) return null;
    return { city, state };
}

export function formatServiceCity(raw: string): string | null {
    const parsed = parseCityState(raw);
    if (!parsed) return null;
    return `${parsed.city} ${parsed.state}`;
}

export function titleCity(raw: string): string {
    return raw
        .trim()
        .split(/\s+/)
        .map((word) => {
            if (/^s$/i.test(word)) return "s";
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

export type ParsedAddress = {
    line1: string | null;
    city: string | null;
    state: string | null;
};

const STREET_LOOKS = new RegExp(
    `^\\d+\\s+|\\b(?:${STREET_SUFFIX}|suite|ste|#)\\b`,
    "i"
);

export function parseAddress(raw: string): ParsedAddress {
    const empty = { line1: null, city: null, state: null };
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) return empty;

    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return empty;

    const last = parts[parts.length - 1];
    const lastState = normalizeState(last.replace(/\d+/g, "").trim());

    if (parts.length >= 3 && lastState) {
        return {
            line1: parts.slice(0, -2).join(", ") || null,
            city: titleCity(parts[parts.length - 2]),
            state: lastState,
        };
    }

    if (parts.length === 2 && lastState) {
        const head = parts[0];
        if (!STREET_LOOKS.test(head)) {
            return { line1: null, city: titleCity(head), state: lastState };
        }
        const split = splitStreetAndCity(head);
        return {
            line1: split.line1,
            city: split.city,
            state: lastState,
        };
    }

    if (parts.length === 1 && lastState) {
        return { line1: null, city: null, state: lastState };
    }

    if (parts.length === 1 && STREET_LOOKS.test(parts[0])) {
        const split = splitStreetAndCity(parts[0]);
        return { line1: split.line1, city: split.city, state: null };
    }

    return { line1: text, city: null, state: null };
}

function splitStreetAndCity(head: string): { line1: string | null; city: string | null } {
    const re = new RegExp(
        `^(.*\\b(?:${STREET_SUFFIX})\\.?\\s*(?:(?:ste\\.?|suite|#)\\s*[A-Za-z0-9-]+)?)\\s+(.+)$`,
        "i"
    );
    const match = head.match(re);
    if (!match) return { line1: head, city: null };
    return { line1: collapseSpace(match[1]), city: titleCity(match[2]) };
}

function collapseSpace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

export function cleanUrl(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const url = new URL(withProto);
        if (!url.hostname) return null;
        url.hash = "";
        url.search = "";
        let path = url.pathname.replace(/\/+$/, "");
        if (path === "/") path = "";
        return `${url.origin}${path}`;
    } catch {
        return null;
    }
}

export function isLikelyEmail(raw: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function normalizeAreaText(raw: string): string | null {
    const parts = splitList(raw)
        .map((part) => normalizeAreaToken(part))
        .filter(Boolean);
    if (parts.length === 0) return null;
    return unique(parts).join(", ");
}

export function normalizeAreaToken(raw: string): string {
    let value = raw
        .replace(/^serving\s+/i, "")
        .replace(/\s+area$/i, "")
        .replace(/\s+/g, " ")
        .trim();

    const withState = value.match(/^(.*?)[, ]+([A-Za-z]{2})$/);
    if (withState && normalizeState(withState[2])) {
        value = withState[1].trim();
    }

    return value;
}

/** Saint Johns ↔ St Johns ↔ St. Johns */
export function areaTokenKeys(raw: string): string[] {
    const base = normalizeAreaToken(raw);
    if (!base) return [];

    const variants = new Set<string>([base]);
    variants.add(base.replace(/\bst\.?\s+/gi, "Saint "));
    variants.add(base.replace(/\bsaint\s+/gi, "St "));
    variants.add(base.replace(/\bsaint\s+/gi, "St. "));

    const keys = new Set<string>();
    for (const variant of variants) {
        const key = normKey(variant);
        if (!key) continue;
        keys.add(key);
        keys.add(compactKey(variant));
    }
    return [...keys];
}

export type ParsedHours = {
    mode: HoursMode;
    note: string | null;
    slots: Array<{
        weekday: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
        sortOrder: number;
    }>;
};

const DAY_TO_WEEKDAY: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
};

function to24h(raw: string): string | null {
    const match = raw
        .trim()
        .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? "0");
    const ap = match[3].toLowerCase();
    if (hour < 1 || hour > 12 || minute > 59) return null;
    if (ap === "am") {
        if (hour === 12) hour = 0;
    } else if (hour !== 12) {
        hour += 12;
    }
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseHours(raw: string): ParsedHours | null {
    const note = raw.replace(/\r\n/g, "\n").trim() || null;
    if (!note) return null;

    const chunks = note
        .split(",")
        .map((part) => part.replace(/\n/g, " ").trim())
        .filter(Boolean);

    const slots: ParsedHours["slots"] = [];
    let appointmentDays = 0;
    let open24Days = 0;
    let closedDays = 0;

    for (const chunk of chunks) {
        const match = chunk.match(
            /^(sun|sunday|mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday)\s+(.+)$/i
        );
        if (!match) continue;
        const weekday = DAY_TO_WEEKDAY[match[1].toLowerCase()];
        if (weekday === undefined) continue;
        const rest = match[2].replace(/\(next day\)/i, "").trim();
        const restKey = normKey(rest);

        if (restKey === "closed") {
            closedDays += 1;
            slots.push({
                weekday,
                openTime: null,
                closeTime: null,
                isClosed: true,
                sortOrder: 0,
            });
            continue;
        }

        if (restKey.includes("appointment") || restKey.includes("by appt")) {
            appointmentDays += 1;
            slots.push({
                weekday,
                openTime: null,
                closeTime: null,
                isClosed: false,
                sortOrder: 0,
            });
            continue;
        }

        if (restKey.includes("open 24") || restKey === "24 hours" || restKey === "24 7") {
            open24Days += 1;
            slots.push({
                weekday,
                openTime: "00:00",
                closeTime: "23:59",
                isClosed: false,
                sortOrder: 0,
            });
            continue;
        }

        const range = rest.split(/\s*-\s*/);
        if (range.length >= 2) {
            const openTime = to24h(range[0]);
            const closeTime = to24h(range[1]);
            if (openTime && closeTime) {
                slots.push({
                    weekday,
                    openTime,
                    closeTime,
                    isClosed: false,
                    sortOrder: 0,
                });
                continue;
            }
        }

        slots.push({
            weekday,
            openTime: null,
            closeTime: null,
            isClosed: false,
            sortOrder: 0,
        });
    }

    if (slots.length === 0) {
        return { mode: "weekly", note, slots: [] };
    }

    const uniqueDays = new Set(slots.map((s) => s.weekday));
    let mode: HoursMode = "weekly";
    if (uniqueDays.size === 7 && open24Days === 7) mode = "always_open";
    else if (uniqueDays.size > 0 && appointmentDays === uniqueDays.size) {
        mode = "by_appointment";
    }

    return { mode, note, slots };
}

export type SocialLink = { type: CompanyLinkType; url: string };

export function collectLinks(input: {
    website: string;
    yelp: string;
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
    linkedin: string;
}): SocialLink[] {
    const pairs: Array<[CompanyLinkType, string]> = [
        ["website", input.website],
        ["yelp", input.yelp],
        ["facebook", input.facebook],
        ["instagram", input.instagram],
        ["youtube", input.youtube],
        ["twitter", input.twitter],
        ["linkedin", input.linkedin],
    ];
    const out: SocialLink[] = [];
    const used = new Set<CompanyLinkType>();
    for (const [type, raw] of pairs) {
        const url = cleanUrl(raw);
        if (!url || used.has(type)) continue;
        used.add(type);
        out.push({ type, url });
    }
    return out;
}
