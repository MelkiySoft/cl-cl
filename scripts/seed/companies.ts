import { eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import {
    users,
    companies,
    companyImages,
    companyToCategory,
    categories,
} from "@/db/schema"

// ============================================================
// Настройки
// ============================================================
const FAKE_COMPANIES_COUNT = 200 // ← меняй здесь

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

const CITIES = [
    { city: "Austin", state: "TX", zip: "78701" },
    { city: "Dallas", state: "TX", zip: "75201" },
    { city: "Houston", state: "TX", zip: "77001" },
    { city: "Los Angeles", state: "CA", zip: "90001" },
    { city: "San Francisco", state: "CA", zip: "94102" },
    { city: "New York", state: "NY", zip: "10001" },
    { city: "Chicago", state: "IL", zip: "60601" },
    { city: "Miami", state: "FL", zip: "33101" },
    { city: "Seattle", state: "WA", zip: "98101" },
    { city: "Denver", state: "CO", zip: "80201" },
]

// ============================================================

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export async function seedCompanies() {
    console.log("→ Seeding companies...")

    const existing = await db.query.companies.findFirst()
    if (existing) {
        console.log("  • Companies already exist — skip\n")
        return
    }

    // --- Providers ---
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

    // --- Categories (для привязки) ---
    const allCategories = await db.query.categories.findMany({
        where: eq(categories.status, true),
        columns: { id: true, slug: true },
    })

    if (allCategories.length === 0) {
        console.log("  ✗ No categories found — run seedCategories first\n")
        return
    }

    console.log(`  • Generating ${FAKE_COMPANIES_COUNT} fake companies...`)

    const companyValues = []
    const imageValues: { companyIndex: number; image: string }[] = []
    const categoryLinks: { companyIndex: number; categoryId: number }[] = []

    for (let i = 1; i <= FAKE_COMPANIES_COUNT; i++) {
        const providerEmail = PROVIDER_EMAILS[(i - 1) % PROVIDER_EMAILS.length]
        const provider = providerByEmail[providerEmail]

        if (!provider) continue

        const location = pick(CITIES)
        const image = pick(IMAGES)
        const num = String(i).padStart(3, "0")

        companyValues.push({
            userId: provider.id,
            entityType: "company" as const,
            legalName: `Company Name ${i} LLC`,
            dbaName: `Company Name ${i}`,
            name: `Company Name ${i}`,
            slug: `company-name-${i}`,
            description: `Professional cleaning services by Company Name ${i}. Fully insured and bonded. Serving residential and commercial clients.`,
            metaTitle: `Company Name ${i} — Cleaning Services`,
            metaDescription: `Hire Company Name ${i} for reliable cleaning services.`,
            image,
            phone: `+1-555-${String(1000 + (i % 9000)).padStart(4, "0")}`,
            email: `info@company${i}.example`,
            website: `https://company${i}.example`,
            ein: `${String(10 + (i % 90)).padStart(2, "0")}-${String(1000000 + i).slice(0, 7)}`,
            businessStructure: "llc" as const,
            yearFounded: 2010 + (i % 15),
            employeesCount: 3 + (i % 40),
            isInsured: true,
            isBonded: i % 3 !== 0,
            isLicensed: i % 4 !== 0,
            addressLine1: `${100 + (i % 900)} Main Street`,
            city: location.city,
            state: location.state,
            zip: location.zip,
            country: "US",
            status: true,
            moderationStatus: "approved" as const,
            approvedAt: new Date(),
            sortOrder: i,
            viewed: i % 50,
        })

        // главное изображение уже в поле image, дополнительно кладём в company_images
        imageValues.push({ companyIndex: i - 1, image })

        // 1–2 случайные категории
        const cat1 = pick(allCategories)
        categoryLinks.push({ companyIndex: i - 1, categoryId: cat1.id })

        if (Math.random() > 0.4) {
            const cat2 = pick(allCategories)
            if (cat2.id !== cat1.id) {
                categoryLinks.push({ companyIndex: i - 1, categoryId: cat2.id })
            }
        }
    }

    // --- Batch insert companies ---
    const inserted = await db
        .insert(companies)
        .values(companyValues)
        .returning({ id: companies.id })

    console.log(`  ✓ Inserted ${inserted.length} companies`)

    // --- company_images ---
    if (imageValues.length > 0) {
        await db.insert(companyImages).values(
            imageValues.map((v) => ({
                companyId: inserted[v.companyIndex].id,
                image: v.image,
                sortOrder: 0,
            }))
        )
        console.log(`  ✓ Inserted ${imageValues.length} company images`)
    }

    // --- company_to_category ---
    if (categoryLinks.length > 0) {
        // убираем возможные дубли (одна компания + одна категория)
        const uniqueLinks = Array.from(
            new Map(
                categoryLinks.map((l) => [
                    `${inserted[l.companyIndex].id}-${l.categoryId}`,
                    {
                        companyId: inserted[l.companyIndex].id,
                        categoryId: l.categoryId,
                        isMain: true,
                    },
                ])
            ).values()
        )

        await db.insert(companyToCategory).values(uniqueLinks)
        console.log(`  ✓ Linked ${uniqueLinks.length} company↔category`)
    }

    console.log("✓ Companies seeded\n")
}