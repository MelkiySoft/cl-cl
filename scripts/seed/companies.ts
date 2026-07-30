import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
    users,
    companies,
    companyImages,
    companyToCategory,
    categories,
} from "@/db/schema";

export async function seedCompanies() {
    console.log("→ Seeding companies...");

    const existing = await db.query.companies.findFirst();
    if (existing) {
        console.log("  • Companies already exist — skip\n");
        return;
    }

    // нужен provider-пользователь из seedUsers
    const provider = await db.query.users.findFirst({
        where: eq(users.email, "provider1@op.com"),
    });

    if (!provider) {
        console.log("  ✗ provider1@op.com not found — run seedUsers first\n");
        return;
    }

    // берём несколько категорий по slug
    const apartment = await db.query.categories.findFirst({
        where: eq(categories.slug, "apartment-cleaning"),
    });
    const office = await db.query.categories.findFirst({
        where: eq(categories.slug, "office-cleaning"),
    });
    const carpet = await db.query.categories.findFirst({
        where: eq(categories.slug, "carpet-cleaning"),
    });

    // ---------- Company 1: LLC ----------
    const [company1] = await db
        .insert(companies)
        .values({
            userId: provider.id,
            entityType: "company",
            legalName: "Sparkle Clean LLC",
            dbaName: "Sparkle Clean",
            name: "Sparkle Clean",
            slug: "sparkle-clean",
            description:
                "Professional residential and commercial cleaning services in the greater area. Fully insured and bonded.",
            metaTitle: "Sparkle Clean — Professional Cleaning Services",
            phone: "+1-555-0101",
            email: "hello@sparkleclean.example",
            website: "https://sparkleclean.example",
            ein: "12-3456789",
            businessStructure: "llc",
            yearFounded: 2018,
            employeesCount: 12,
            isInsured: true,
            isBonded: true,
            isLicensed: true,
            addressLine1: "123 Main St",
            city: "Austin",
            state: "TX",
            zip: "78701",
            country: "US",
            status: true,
            moderationStatus: "approved",
            approvedAt: new Date(),
            sortOrder: 1,
        })
        .returning({ id: companies.id });

    await db.insert(companyImages).values([
        { companyId: company1.id, image: "/seed/sparkle-1.jpg", sortOrder: 0 },
        { companyId: company1.id, image: "/seed/sparkle-2.jpg", sortOrder: 1 },
    ]);

    if (apartment) {
        await db.insert(companyToCategory).values({
            companyId: company1.id,
            categoryId: apartment.id,
            isMain: true,
        });
    }
    if (carpet) {
        await db.insert(companyToCategory).values({
            companyId: company1.id,
            categoryId: carpet.id,
            isMain: false,
        });
    }

    console.log("  ✓ Sparkle Clean LLC");

    // ---------- Company 2: Individual / sole prop ----------
    const [company2] = await db
        .insert(companies)
        .values({
            userId: provider.id,
            entityType: "individual",
            legalName: "Maria Gonzalez",
            name: "Maria's Home Cleaning",
            slug: "marias-home-cleaning",
            description:
                "Reliable house and apartment cleaning by an experienced independent cleaner.",
            phone: "+1-555-0102",
            email: "maria@example.com",
            // sole prop часто работает по SSN, EIN может не быть
            ssn: "XXX-XX-1234", // в сиде маска; в реале — шифровать
            businessStructure: "sole_proprietorship",
            yearFounded: 2021,
            employeesCount: 1,
            isInsured: true,
            isBonded: false,
            isLicensed: false,
            addressLine1: "456 Oak Ave",
            city: "Austin",
            state: "TX",
            zip: "78702",
            country: "US",
            status: true,
            moderationStatus: "approved",
            approvedAt: new Date(),
            sortOrder: 2,
        })
        .returning({ id: companies.id });

    if (apartment) {
        await db.insert(companyToCategory).values({
            companyId: company2.id,
            categoryId: apartment.id,
            isMain: true,
        });
    }

    console.log("  ✓ Maria's Home Cleaning (individual)");

    // ---------- Company 3: pending moderation ----------
    const [company3] = await db
        .insert(companies)
        .values({
            userId: provider.id,
            entityType: "company",
            legalName: "OfficePro Cleaning Inc.",
            name: "OfficePro Cleaning",
            slug: "officepro-cleaning",
            description: "Commercial office cleaning. Pending admin review.",
            ein: "98-7654321",
            businessStructure: "corporation",
            yearFounded: 2015,
            employeesCount: 40,
            isInsured: true,
            isBonded: true,
            isLicensed: true,
            city: "Dallas",
            state: "TX",
            zip: "75201",
            country: "US",
            status: false, // ещё не в каталоге
            moderationStatus: "pending",
            sortOrder: 3,
        })
        .returning({ id: companies.id });

    if (office) {
        await db.insert(companyToCategory).values({
            companyId: company3.id,
            categoryId: office.id,
            isMain: true,
        });
    }

    console.log("  ✓ OfficePro Cleaning (pending)");
    console.log("✓ Companies seeded\n");
}