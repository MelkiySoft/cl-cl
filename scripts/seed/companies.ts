import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    users,
    companies,
    companyImages,
    companyToCategory,
    companyLinks,
    companyHours,
    companyAttributes,
    categories,
    categoryPath,
} from "@/db/schema"
import {
    ATTRIBUTE_ID,
    ATTRIBUTE_VALUE_ID,
} from "@/lib/attributes"

// ============================================================
// Настройки
// ============================================================
const OWNED_COMPANIES_COUNT = 150
const UNCLAIMED_COMPANIES_COUNT = 50
const FAKE_COMPANIES_COUNT = OWNED_COMPANIES_COUNT + UNCLAIMED_COMPANIES_COUNT

const PROVIDER_EMAILS = [
    "provider1@op.com",
    "provider2@op.com",
    "provider3@op.com",
]

const IMAGES = [
    "/demo/company1.jpg",
    "/demo/company2.jpg",
    "/demo/company3.jpg",
]

const GALLERY_IMAGES = [
    "/demo/gallery1.jpg",
    "/demo/gallery2.jpg",
    "/demo/gallery3.jpg",
]

const NAME_PREFIXES = [
    "Sparkle",
    "Bright",
    "Fresh",
    "Prime",
    "Elite",
    "Harbor",
    "Summit",
    "Cedar",
    "Pacific",
    "Metro",
    "Golden",
    "Northstar",
    "Bluebird",
    "Ironwood",
    "Lakeside",
]

const NAME_SUFFIXES_BY_ROOT_SLUG: Record<string, string[]> = {
    "house-cleaning": ["Cleaning", "Maids", "Home Care", "Clean Co", "Shine"],
    "commercial-cleaning": ["Janitorial", "Facility Services", "Cleaning", "Clean Co"],
    "maid-service": ["Maids", "Home Care", "Shine"],
    "upholstery-cleaning": ["Cleaning", "Shine"],
    "air-duct-cleaning": ["Cleaning", "Facility Services"],
    "mold-remediation": ["Cleaning", "Facility Services"],
    "pest-control": ["Pest Pros", "Facility Services"],
    "pool-cleaning": ["Pool Care", "Shine"],
    "cleaning-outside": ["Cleaning", "Shine", "Clean Co"],
    "vehicle-equipment-cleaning": ["Detailing", "Shine"],
    "junk-removal": ["Junk Hauling", "Clean Co"],
    "sewer-cleaning": ["Cleaning", "Facility Services"],
    laundry: ["Laundry", "Clean Co"],
    "dry-cleaning": ["Dry Cleaning", "Clean Co"],
}

const DEFAULT_NAME_SUFFIXES = [
    "Cleaning",
    "Maids",
    "Janitorial",
    "Home Care",
    "Clean Co",
    "Facility Services",
    "Shine",
]

const BUSINESS_STRUCTURES = [
    "llc",
    "sole_proprietorship",
    "corporation",
    "partnership",
    "other",
] as const

const HOURS_MODES = ["weekly", "always_open", "by_appointment"] as const

const CITIES = [
    { city: "Austin", state: "TX", zips: ["78701", "78702", "78703", "78704"] },
    { city: "Dallas", state: "TX", zips: ["75201", "75202", "75204"] },
    { city: "Houston", state: "TX", zips: ["77001", "77002", "77003", "77007"] },
    { city: "Los Angeles", state: "CA", zips: ["90001", "90004", "90012", "90015"] },
    { city: "San Francisco", state: "CA", zips: ["94102", "94103", "94107", "94110"] },
    { city: "New York", state: "NY", zips: ["10001", "10002", "10003", "10011"] },
    { city: "Chicago", state: "IL", zips: ["60601", "60602", "60605", "60607"] },
    { city: "Miami", state: "FL", zips: ["33101", "33125", "33130", "33132"] },
    { city: "Seattle", state: "WA", zips: ["98101", "98102", "98104", "98109"] },
    { city: "Denver", state: "CO", zips: ["80201", "80202", "80203", "80205"] },
]

const LANGUAGE_VALUES = [
    ATTRIBUTE_VALUE_ID.english,
    ATTRIBUTE_VALUE_ID.spanish,
    ATTRIBUTE_VALUE_ID.polish,
    ATTRIBUTE_VALUE_ID.ukrainian,
    ATTRIBUTE_VALUE_ID.italian,
    ATTRIBUTE_VALUE_ID.aslProficient,
]

const PAYMENT_VALUES = [
    ATTRIBUTE_VALUE_ID.cash,
    ATTRIBUTE_VALUE_ID.creditCard,
    ATTRIBUTE_VALUE_ID.check,
    ATTRIBUTE_VALUE_ID.zelle,
    ATTRIBUTE_VALUE_ID.venmo,
    ATTRIBUTE_VALUE_ID.payPal,
    ATTRIBUTE_VALUE_ID.applePay,
    ATTRIBUTE_VALUE_ID.googlePay,
    ATTRIBUTE_VALUE_ID.cryptocurrency,
    ATTRIBUTE_VALUE_ID.samsungPay,
]

const OWNED_VALUES = [
    ATTRIBUTE_VALUE_ID.women,
    ATTRIBUTE_VALUE_ID.family,
    ATTRIBUTE_VALUE_ID.latinx,
    ATTRIBUTE_VALUE_ID.asian,
    ATTRIBUTE_VALUE_ID.black,
    ATTRIBUTE_VALUE_ID.veteran,
    ATTRIBUTE_VALUE_ID.lgbtq,
    ATTRIBUTE_VALUE_ID.locally,
    ATTRIBUTE_VALUE_ID.disabled,
    ATTRIBUTE_VALUE_ID.indigenous,
    ATTRIBUTE_VALUE_ID.minority,
]

const CANCEL_VALUES = [
    ATTRIBUTE_VALUE_ID.notice24h,
    ATTRIBUTE_VALUE_ID.notice48h,
    ATTRIBUTE_VALUE_ID.notice72h,
]

const LINK_TYPES = [
    "google_business",
    "yelp",
    "facebook",
    "instagram",
    "linkedin",
] as const

type SeedCategoryRow = {
    id: number
    parentId: number | null
    slug: string
    name: string
}

// ============================================================

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function pickSome<T>(arr: T[], min: number, max: number): T[] {
    const count = min + Math.floor(Math.random() * (max - min + 1))
    const pool = [...arr]
    const selected: T[] = []
    while (selected.length < count && pool.length > 0) {
        const index = Math.floor(Math.random() * pool.length)
        selected.push(pool.splice(index, 1)[0])
    }
    return selected
}

function unique<T>(items: T[]): T[] {
    return [...new Set(items)]
}

function suffixForRoot(rootSlug: string, index: number): string {
    const list = NAME_SUFFIXES_BY_ROOT_SLUG[rootSlug] ?? DEFAULT_NAME_SUFFIXES
    return list[index % list.length]
}

// ============================================================

export async function seedCompanies() {
    console.log("→ Seeding companies...")

    const existing = await db.query.companies.findFirst()
    if (existing) {
        console.log("  • Companies already exist — skip\n")
        return
    }

    const providers = await db.query.users.findMany({
        where: inArray(users.email, PROVIDER_EMAILS),
    })

    if (providers.length === 0) {
        console.log("  ✗ No providers found — run seedUsers first\n")
        return
    }

    const providerByEmail = Object.fromEntries(
        providers.map((p) => [p.email, p])
    )

    const allCategories = await db.query.categories.findMany({
        where: eq(categories.status, true),
        columns: { id: true, parentId: true, slug: true, name: true },
    })

    if (allCategories.length === 0) {
        console.log("  ✗ No categories found — run seedCategories first\n")
        return
    }

    const parentIds = new Set(
        allCategories
            .map((category) => category.parentId)
            .filter((id): id is number => id != null)
    )
    const leaves = allCategories.filter((category) => !parentIds.has(category.id))

    if (leaves.length === 0) {
        console.log("  ✗ No leaf categories found\n")
        return
    }

    const categoryById = new Map(allCategories.map((category) => [category.id, category]))

    const paths = await db.query.categoryPath.findMany()
    const pathIdsByCategory = new Map<number, number[]>()
    const rootByCategory = new Map<number, number>()

    for (const row of paths) {
        const list = pathIdsByCategory.get(row.categoryId) ?? []
        list.push(row.pathId)
        pathIdsByCategory.set(row.categoryId, list)
        if (row.level === 0) {
            rootByCategory.set(row.categoryId, row.pathId)
        }
    }

    const leavesByRoot = new Map<number, SeedCategoryRow[]>()
    for (const leaf of leaves) {
        const rootId = rootByCategory.get(leaf.id) ?? leaf.id
        const list = leavesByRoot.get(rootId) ?? []
        list.push(leaf)
        leavesByRoot.set(rootId, list)
    }

    console.log(
        `  • Generating ${FAKE_COMPANIES_COUNT} companies (${OWNED_COMPANIES_COUNT} owned, ${UNCLAIMED_COMPANIES_COUNT} unclaimed) across ${leaves.length} leaf categories...`
    )

    const companyValues = []
    const imageValues: { companyIndex: number; image: string }[] = []
    const categoryLinks: {
        companyIndex: number
        categoryId: number
        isMain: boolean
    }[] = []
    const hourValues: {
        companyIndex: number
        weekday: number
        openTime: string | null
        closeTime: string | null
        isClosed: boolean
        sortOrder: number
    }[] = []
    const linkValues: {
        companyIndex: number
        type: (typeof LINK_TYPES)[number] | "website"
        url: string
        sortOrder: number
    }[] = []
    const attributeValues: {
        companyIndex: number
        attributeId: number
        valueId?: number
        valueBoolean?: boolean
    }[] = []

    for (let i = 1; i <= FAKE_COMPANIES_COUNT; i++) {
        const owned = i <= OWNED_COMPANIES_COUNT
        const providerEmail = PROVIDER_EMAILS[(i - 1) % PROVIDER_EMAILS.length]
        const provider = providerByEmail[providerEmail]

        if (owned && !provider) continue

        const location = CITIES[(i - 1) % CITIES.length]
        const image = IMAGES[(i - 1) % IMAGES.length]
        const prefix = NAME_PREFIXES[(i - 1) % NAME_PREFIXES.length]
        const entityType = i % 9 === 0 ? ("individual" as const) : ("company" as const)
        const hoursMode = HOURS_MODES[i % 11 === 0 ? 1 : i % 13 === 0 ? 2 : 0]
        const structure = BUSINESS_STRUCTURES[i % BUSINESS_STRUCTURES.length]
        const serviceZips = location.zips.slice(0, 1 + (i % location.zips.length))
        const pending = owned && i % 17 === 0
        const hidden = owned && i % 19 === 0

        // Равномерно покрываем все листовые категории нового дерева
        const mainLeaf = leaves[(i - 1) % leaves.length]
        const rootId = rootByCategory.get(mainLeaf.id) ?? mainLeaf.id
        const rootCategory = categoryById.get(rootId)
        const rootSlug = rootCategory?.slug ?? mainLeaf.slug
        const suffix = suffixForRoot(rootSlug, i - 1)
        const displayName = `${prefix} ${suffix} ${i}`

        companyValues.push({
            userId: owned ? provider.id : null,
            source: "seed" as const,
            externalId: `seed-${String(i).padStart(3, "0")}`,
            claimedAt: null,
            entityType,
            legalName:
                entityType === "individual"
                    ? `${prefix} Owner ${i}`
                    : `${displayName} ${structure === "llc" ? "LLC" : "Inc"}`,
            dbaName: displayName,
            name: displayName,
            slug: `company-name-${i}`,
            description: `${displayName} provides ${mainLeaf.name.toLowerCase()} in ${location.city}, ${location.state}. Insured crews and flexible scheduling.`,
            metaTitle: `${displayName} — ${mainLeaf.name} in ${location.city}, ${location.state}`,
            metaDescription: `Book ${displayName} for ${mainLeaf.name.toLowerCase()} in ${location.city}.`,
            metaKeyword: `${mainLeaf.name.toLowerCase()}, ${location.city}, ${displayName.toLowerCase()}`,
            metaH1: `${displayName} in ${location.city}`,
            image,
            phone: `+1-555-${String(1000 + (i % 9000)).padStart(4, "0")}`,
            email: `info@company${i}.example`,
            ein: `${String(10 + (i % 90)).padStart(2, "0")}-${String(1000000 + i).slice(0, 7)}`,
            businessStructure: structure,
            yearFounded: 2005 + (i % 20),
            employeesCount: 2 + (i % 48),
            isInsured: true,
            isBonded: i % 3 !== 0,
            isLicensed: i % 4 !== 0,
            hoursMode,
            hoursNote:
                hoursMode === "by_appointment"
                    ? "Appointments booked 24 hours in advance."
                    : hoursMode === "always_open"
                        ? "Crews available around the clock for emergency cleanups."
                        : "Weekend slots fill quickly.",
            hqAddressLine1: `${100 + (i % 900)} Main Street`,
            hqCity: location.city,
            hqState: location.state,
            hqZip: location.zips[0],
            sCity: `${location.city} ${location.state}`,
            sZips: serviceZips,
            sArea: `${location.city} metro and nearby ZIP codes: ${serviceZips.join(", ")}.`,
            status: pending ? false : !hidden,
            moderationStatus: pending ? ("pending" as const) : ("approved" as const),
            moderationNote: pending ? "Waiting for document review." : null,
            approvedAt: pending ? null : new Date(),
            sortOrder: i,
            viewed: 10 + (i % 240),
        })

        imageValues.push({ companyIndex: i - 1, image })

        const sameRootLeaves = (leavesByRoot.get(rootId) ?? [mainLeaf]).filter(
            (leaf) => leaf.id !== mainLeaf.id
        )
        const extraLeaves = pickSome(sameRootLeaves, 0, Math.min(2, sameRootLeaves.length))
        const selectedLeaves = [mainLeaf, ...extraLeaves]

        for (const leaf of selectedLeaves) {
            const pathIds = unique([
                ...(pathIdsByCategory.get(leaf.id) ?? []),
                leaf.id,
            ])
            for (const categoryId of pathIds) {
                categoryLinks.push({
                    companyIndex: i - 1,
                    categoryId,
                    isMain: categoryId === mainLeaf.id,
                })
            }
        }

        if (hoursMode === "weekly") {
            for (let weekday = 0; weekday <= 6; weekday++) {
                const isClosed = weekday === 0
                hourValues.push({
                    companyIndex: i - 1,
                    weekday,
                    openTime: isClosed ? null : weekday === 6 ? "09:00" : "08:00",
                    closeTime: isClosed ? null : weekday === 6 ? "14:00" : "18:00",
                    isClosed,
                    sortOrder: 0,
                })
            }
        }

        const handle = `company${i}`
        linkValues.push({
            companyIndex: i - 1,
            type: "website",
            url: `https://${handle}.example`,
            sortOrder: 0,
        })
        for (const [index, type] of pickSome([...LINK_TYPES], 2, 4).entries()) {
            const path =
                type === "google_business"
                    ? `https://maps.google.com/?q=${encodeURIComponent(displayName)}`
                    : `https://www.${type === "linkedin" ? "linkedin.com/company" : type + ".com"}/${handle}`
            linkValues.push({
                companyIndex: i - 1,
                type,
                url: path,
                sortOrder: index + 1,
            })
        }

        const languages = unique([
            ATTRIBUTE_VALUE_ID.english,
            ...pickSome(LANGUAGE_VALUES.slice(1), 0, 3),
        ])
        for (const valueId of languages) {
            attributeValues.push({
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.languages,
                valueId,
            })
        }

        const payments = unique([
            ATTRIBUTE_VALUE_ID.cash,
            ATTRIBUTE_VALUE_ID.creditCard,
            ...pickSome(PAYMENT_VALUES.slice(2), 1, 4),
        ])
        for (const valueId of payments) {
            attributeValues.push({
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.paymentMethods,
                valueId,
            })
        }

        attributeValues.push(
            {
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.ecoFriendlyProducts,
                valueBoolean: i % 2 === 0,
            },
            {
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.sameDayBooking,
                valueBoolean: i % 3 === 0,
            },
            {
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.franchiseAffiliation,
                valueBoolean: i % 11 === 0,
            },
            {
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.serviceGuarantee,
                valueBoolean: i % 4 !== 0,
            },
            {
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.cancellationPolicy,
                valueId: CANCEL_VALUES[i % CANCEL_VALUES.length],
            }
        )

        for (const valueId of pickSome(OWNED_VALUES, 0, 2)) {
            attributeValues.push({
                companyIndex: i - 1,
                attributeId: ATTRIBUTE_ID.owned,
                valueId,
            })
        }
    }

    const inserted = await db
        .insert(companies)
        .values(companyValues)
        .returning({ id: companies.id })

    console.log(`  ✓ Inserted ${inserted.length} companies`)

    if (linkValues.length > 0) {
        await db.insert(companyLinks).values(
            linkValues.map((row) => ({
                companyId: inserted[row.companyIndex].id,
                type: row.type,
                url: row.url,
                sortOrder: row.sortOrder,
            }))
        )
        console.log(`  ✓ Inserted ${linkValues.length} company links`)
    }

    if (hourValues.length > 0) {
        await db.insert(companyHours).values(
            hourValues.map((row) => ({
                companyId: inserted[row.companyIndex].id,
                weekday: row.weekday,
                openTime: row.openTime,
                closeTime: row.closeTime,
                isClosed: row.isClosed,
                sortOrder: row.sortOrder,
            }))
        )
        console.log(`  ✓ Inserted ${hourValues.length} company hours`)
    }

    if (attributeValues.length > 0) {
        await db.insert(companyAttributes).values(
            attributeValues.map((row) => ({
                companyId: inserted[row.companyIndex].id,
                attributeId: row.attributeId,
                valueId: row.valueId ?? null,
                valueBoolean: row.valueBoolean ?? null,
                valueNumber: null,
            }))
        )
        console.log(`  ✓ Inserted ${attributeValues.length} company attributes`)
    }

    if (imageValues.length > 0) {
        await db.insert(companyImages).values(
            imageValues.map((row) => ({
                companyId: inserted[row.companyIndex].id,
                image: row.image,
                sortOrder: 0,
            }))
        )
        console.log(`  ✓ Inserted ${imageValues.length} cover images`)
    }

    const galleryRows: {
        companyId: number
        image: string
        sortOrder: number
    }[] = []

    for (const company of inserted) {
        GALLERY_IMAGES.forEach((image, index) => {
            galleryRows.push({
                companyId: company.id,
                image,
                sortOrder: index + 1,
            })
        })
    }

    if (galleryRows.length > 0) {
        await db.insert(companyImages).values(galleryRows)
        console.log(`  ✓ Inserted ${galleryRows.length} gallery images`)
    }

    if (categoryLinks.length > 0) {
        const uniqueLinks = Array.from(
            new Map(
                categoryLinks.map((row) => [
                    `${inserted[row.companyIndex].id}-${row.categoryId}`,
                    {
                        companyId: inserted[row.companyIndex].id,
                        categoryId: row.categoryId,
                        isMain: row.isMain,
                    },
                ])
            ).values()
        )

        await db.insert(companyToCategory).values(uniqueLinks)
        console.log(`  ✓ Linked ${uniqueLinks.length} company↔category`)
    }

    console.log("✓ Companies seeded\n")
}
