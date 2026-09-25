import { ATTRIBUTE_ID, ATTRIBUTE_VALUE_ID } from "@/lib/attributes"

/**
 * Плоский словарь slug → фильтр.
 * Все slug уникальны. Токены в URL сортируются по алфавиту.
 *
 * Группы (AND между группами, OR внутри):
 * - zip
 * - flags (insured / bonded / licensed)
 * - bool-attrs (eco, same_day, …)
 * - languages / payment / owned (по attributeId)
 */

export type FilterTokenKind =
    | "zip"
    | "flag"
    | "attr_bool"
    | "attr_val"

export type FilterTokenDef =
    | { kind: "zip" }
    | { kind: "flag"; flag: "insured" | "bonded" | "licensed" }
    | { kind: "attr_bool"; attributeId: number }
    | { kind: "attr_val"; attributeId: number; valueId: number }

const ZIP_RE = /^[0-9]{5}$/

/** Статический словарь (не ZIP — ZIP распознаётся по regex). */
export const FILTER_SLUG_MAP: Record<string, FilterTokenDef> = {
    // flags
    insured: { kind: "flag", flag: "insured" },
    bonded: { kind: "flag", flag: "bonded" },
    licensed: { kind: "flag", flag: "licensed" },

    // boolean attributes
    eco: {
        kind: "attr_bool",
        attributeId: ATTRIBUTE_ID.ecoFriendlyProducts,
    },
    same_day: {
        kind: "attr_bool",
        attributeId: ATTRIBUTE_ID.sameDayBooking,
    },
    franchise: {
        kind: "attr_bool",
        attributeId: ATTRIBUTE_ID.franchiseAffiliation,
    },
    guarantee: {
        kind: "attr_bool",
        attributeId: ATTRIBUTE_ID.serviceGuarantee,
    },

    // languages
    english: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.english,
    },
    spanish: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.spanish,
    },
    polish: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.polish,
    },
    asl: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.aslProficient,
    },
    ukrainian: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.ukrainian,
    },
    italian: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.languages,
        valueId: ATTRIBUTE_VALUE_ID.italian,
    },

    // payment
    cash: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.cash,
    },
    credit_card: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.creditCard,
    },
    check: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.check,
    },
    zelle: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.zelle,
    },
    venmo: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.venmo,
    },
    paypal: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.payPal,
    },
    apple_pay: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.applePay,
    },
    google_pay: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.googlePay,
    },
    crypto: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.cryptocurrency,
    },
    samsung_pay: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.paymentMethods,
        valueId: ATTRIBUTE_VALUE_ID.samsungPay,
    },

    // owned
    women: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.women,
    },
    family: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.family,
    },
    latinx: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.latinx,
    },
    asian: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.asian,
    },
    black: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.black,
    },
    veteran: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.veteran,
    },
    lgbtq: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.lgbtq,
    },
    locally: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.locally,
    },
    disabled: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.disabled,
    },
    indigenous: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.indigenous,
    },
    minority: {
        kind: "attr_val",
        attributeId: ATTRIBUTE_ID.owned,
        valueId: ATTRIBUTE_VALUE_ID.minority,
    },
}

export function resolveFilterToken(slug: string): FilterTokenDef | null {
    if (ZIP_RE.test(slug)) return { kind: "zip" }
    return FILTER_SLUG_MAP[slug] ?? null
}

export type CatalogFilters = {
    /** ZIP-коды (OR) */
    zips: string[]
    insured: boolean
    bonded: boolean
    licensed: boolean
    /** attributeId → true (AND между разными attr, каждый bool отдельно) */
    boolAttributeIds: number[]
    /**
     * attributeId → valueIds (OR внутри одного attributeId,
     * AND между разными attributeId)
     */
    valueAttributeIds: Record<number, number[]>
    /** исходные токены (уникальные, отсортированные) */
    tokens: string[]
}

export const EMPTY_FILTERS: CatalogFilters = {
    zips: [],
    insured: false,
    bonded: false,
    licensed: false,
    boolAttributeIds: [],
    valueAttributeIds: {},
    tokens: [],
}

export function hasActiveFilters(f: CatalogFilters): boolean {
    return f.tokens.length > 0
}

/**
 * Нормализация списка токенов: unique + sort.
 */
export function canonicalizeTokens(tokens: string[]): string[] {
    return [...new Set(tokens.map((t) => t.trim().toLowerCase()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
    )
}

/**
 * Собрать сегмент path: f-token1-token2-…
 * Пустой список → null (сегмента нет).
 */
export function buildFilterSegment(tokens: string[]): string | null {
    const sorted = canonicalizeTokens(tokens)
    if (sorted.length === 0) return null
    return `f-${sorted.join("-")}`
}

/**
 * Разобрать сегмент `f-…`.
 *
 * @returns
 * - ok + filters — валидно
 * - redirect — токены валидны, но порядок/дубли не канонические
 * - invalid — неизвестный токен
 * - empty — пустой f- или только `f`
 */
export type ParseFilterSegmentResult =
    | { status: "empty" }
    | { status: "invalid"; unknown: string[] }
    | { status: "redirect"; canonicalSegment: string; filters: CatalogFilters }
    | { status: "ok"; filters: CatalogFilters }

export function parseFilterSegment(
    segment: string | null | undefined
): ParseFilterSegmentResult {
    if (!segment || segment === "f" || segment === "f-") {
        return { status: "empty" }
    }

    if (!segment.startsWith("f-")) {
        return { status: "invalid", unknown: [segment] }
    }

    const raw = segment.slice(2)
    if (!raw) return { status: "empty" }

    // Токены разделены `-`. ZIP и slug'и без внутренних дефисов
    // (credit_card, same_day, apple_pay — underscore).
    const rawTokens = raw.split("-").filter(Boolean)
    if (rawTokens.length === 0) return { status: "empty" }

    const unknown: string[] = []
    for (const t of rawTokens) {
        if (!resolveFilterToken(t)) unknown.push(t)
    }
    if (unknown.length > 0) {
        return { status: "invalid", unknown }
    }

    const uniqueSorted = canonicalizeTokens(rawTokens)
    const filters = tokensToFilters(uniqueSorted)
    // tokensToFilters уже схлопывает несколько ZIP в один
    const canonical = filters.tokens
    const canonicalSegment = `f-${canonical.join("-")}`

    const isCanonical =
        rawTokens.length === canonical.length &&
        rawTokens.every((t, i) => t === canonical[i])

    if (!isCanonical) {
        return {
            status: "redirect",
            canonicalSegment,
            filters,
        }
    }

    return { status: "ok", filters }
}

export function tokensToFilters(tokens: string[]): CatalogFilters {
    const sorted = canonicalizeTokens(tokens)
    const zips: string[] = []
    let insured = false
    let bonded = false
    let licensed = false
    const boolSet = new Set<number>()
    const valueMap: Record<number, Set<number>> = {}

    for (const token of sorted) {
        const def = resolveFilterToken(token)
        if (!def) continue

        switch (def.kind) {
            case "zip":
                zips.push(token)
                break
            case "flag":
                if (def.flag === "insured") insured = true
                if (def.flag === "bonded") bonded = true
                if (def.flag === "licensed") licensed = true
                break
            case "attr_bool":
                boolSet.add(def.attributeId)
                break
            case "attr_val": {
                if (!valueMap[def.attributeId]) {
                    valueMap[def.attributeId] = new Set()
                }
                valueMap[def.attributeId].add(def.valueId)
                break
            }
        }
    }

    const valueAttributeIds: Record<number, number[]> = {}
    for (const [attrId, set] of Object.entries(valueMap)) {
        valueAttributeIds[Number(attrId)] = [...set]
    }

    // Канон: один ZIP. Несколько → оставляем первый по алфавиту (уже sorted).
    const canonicalZips = zips.slice(0, 1)
    const tokensCanonical =
        zips.length > 1
            ? canonicalizeTokens([
                ...sorted.filter((t) => !/^[0-9]{5}$/.test(t)),
                ...canonicalZips,
            ])
            : sorted

    return {
        zips: canonicalZips,
        insured,
        bonded,
        licensed,
        boolAttributeIds: [...boolSet],
        valueAttributeIds,
        tokens: tokensCanonical,
    }
}

/**
 * Вырезать фильтр-сегмент из хвоста path-массива.
 */
export function splitPathAndFilter(path: string[] | undefined): {
    pathWithoutFilter: string[]
    filterSegment: string | null
} {
    const slugs = path ?? []
    if (slugs.length === 0) {
        return { pathWithoutFilter: [], filterSegment: null }
    }

    const last = slugs[slugs.length - 1]
    if (last.startsWith("f-") || last === "f") {
        return {
            pathWithoutFilter: slugs.slice(0, -1),
            filterSegment: last,
        }
    }

    return { pathWithoutFilter: slugs, filterSegment: null }
}

/** UI: группы чекбоксов */
export type FilterUiGroup = {
    id: string
    label: string
    type: "flag" | "bool" | "multi"
    options: { slug: string; label: string }[]
}

export const FILTER_UI_GROUPS: FilterUiGroup[] = [
    {
        id: "credentials",
        label: "Credentials",
        type: "flag",
        options: [
            { slug: "insured", label: "Insured" },
            { slug: "bonded", label: "Bonded" },
            { slug: "licensed", label: "Licensed" },
        ],
    },
    {
        id: "features",
        label: "Features",
        type: "bool",
        options: [
            { slug: "eco", label: "Eco-friendly" },
            { slug: "same_day", label: "Same-day booking" },
            { slug: "franchise", label: "Franchise" },
            { slug: "guarantee", label: "Service guarantee" },
        ],
    },
    {
        id: "languages",
        label: "Languages",
        type: "multi",
        options: [
            { slug: "english", label: "English" },
            { slug: "spanish", label: "Spanish" },
            { slug: "polish", label: "Polish" },
            { slug: "ukrainian", label: "Ukrainian" },
            { slug: "italian", label: "Italian" },
            { slug: "asl", label: "ASL" },
        ],
    },
    {
        id: "payment",
        label: "Payment",
        type: "multi",
        options: [
            { slug: "cash", label: "Cash" },
            { slug: "credit_card", label: "Credit Card" },
            { slug: "check", label: "Check" },
            { slug: "zelle", label: "Zelle" },
            { slug: "venmo", label: "Venmo" },
            { slug: "paypal", label: "PayPal" },
            { slug: "apple_pay", label: "Apple Pay" },
            { slug: "google_pay", label: "Google Pay" },
            { slug: "crypto", label: "Crypto" },
            { slug: "samsung_pay", label: "Samsung Pay" },
        ],
    },
    {
        id: "owned",
        label: "Owned",
        type: "multi",
        options: [
            { slug: "women", label: "Women" },
            { slug: "family", label: "Family" },
            { slug: "latinx", label: "Latinx" },
            { slug: "asian", label: "Asian" },
            { slug: "black", label: "Black" },
            { slug: "veteran", label: "Veteran" },
            { slug: "lgbtq", label: "LGBTQ" },
            { slug: "locally", label: "Locally" },
            { slug: "disabled", label: "Disabled" },
            { slug: "indigenous", label: "Indigenous" },
            { slug: "minority", label: "Minority" },
        ],
    },
]
