import { db } from "@/db";
import { categories, categoryPath } from "@/db/schema";

type SeedCategory = {
    name: string;
    slug: string;
    description?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeyword?: string | null;
    metaH1?: string | null;
    top?: boolean;
    column?: number;
    sortOrder?: number;
    status?: boolean;
    noindex?: boolean;
    children?: SeedCategory[];
};

/**
 * Дерево каталога.
 * Структура и вложенность — актуальный список услуг.
 */
const SEED_CATEGORIES: SeedCategory[] = [
    {
        name: "House Cleaning",
        slug: "house-cleaning",
        top: true,
        column: 1,
        sortOrder: 1,
        noindex: true,
        children: [
            {
                name: "Deep Cleaning",
                slug: "deep-cleaning",
                sortOrder: 1,
                noindex: true,
            },
            {
                name: "Move-out / Move-in Cleaning",
                slug: "move-out-in-cleaning",
                sortOrder: 2,
                noindex: true,
            },
            {
                name: "Regular Cleaning",
                slug: "regular-cleaning",
                sortOrder: 3,
                noindex: true,
            },
            {
                name: "Green Cleaning",
                slug: "green-cleaning",
                sortOrder: 4,
                noindex: true,
            },
            {
                name: "Hoarder Cleaning",
                slug: "hoarder-cleaning",
                sortOrder: 5,
                noindex: true,
            },
            {
                name: "Airbnb Cleaning",
                slug: "airbnb-cleaning",
                sortOrder: 6,
                noindex: true,
            },
        ],
    },
    {
        name: "Commercial Cleaning",
        slug: "commercial-cleaning",
        top: true,
        column: 1,
        sortOrder: 2,
        noindex: true,
        children: [
            {
                name: "Office Cleaning",
                slug: "office-cleaning",
                sortOrder: 1,
                noindex: true,
            },
            {
                name: "Educational Facility Cleaning",
                slug: "educational-facility-cleaning",
                sortOrder: 2,
                noindex: true,
            },
            {
                name: "Retail Store Cleaning",
                slug: "retail-store-cleaning",
                sortOrder: 3,
                noindex: true,
            },
            {
                name: "Industrial Cleaning",
                slug: "industrial-cleaning",
                sortOrder: 4,
                noindex: true,
            },
            {
                name: "Medical Facility Cleaning",
                slug: "medical-facility-cleaning",
                sortOrder: 5,
                noindex: true,
            },
            {
                name: "Restaurant Cleaning",
                slug: "restaurant-cleaning",
                sortOrder: 6,
                noindex: true,
            },
            {
                name: "Janitorial Cleaning",
                slug: "janitorial-cleaning",
                sortOrder: 7,
                noindex: true,
            },
        ],
    },
    {
        name: "Maid Service",
        slug: "maid-service",
        top: true,
        column: 1,
        sortOrder: 3,
        noindex: true,
    },
    {
        name: "Upholstery Cleaning",
        slug: "upholstery-cleaning",
        top: true,
        column: 1,
        sortOrder: 4,
        noindex: true,
    },
    {
        name: "Air Duct Cleaning",
        slug: "air-duct-cleaning",
        top: true,
        column: 1,
        sortOrder: 5,
        noindex: true,
    },
    {
        name: "Mold Remediation",
        slug: "mold-remediation",
        top: true,
        column: 1,
        sortOrder: 6,
        noindex: false,
    },
    {
        name: "Pest Control",
        slug: "pest-control",
        top: true,
        column: 1,
        sortOrder: 7,
        noindex: true,
    },
    {
        name: "Pool Cleaning",
        slug: "pool-cleaning",
        top: true,
        column: 1,
        sortOrder: 8,
        noindex: true,
    },
    {
        name: "Cleaning Outside",
        slug: "cleaning-outside",
        top: true,
        column: 1,
        sortOrder: 9,
        noindex: true,
        children: [
            {
                name: "Window Cleaning",
                slug: "window-cleaning",
                sortOrder: 1,
                noindex: true,
            },
            {
                name: "Pressure Washing",
                slug: "pressure-washing",
                sortOrder: 2,
                noindex: true,
            },
            {
                name: "Gutter Cleaning",
                slug: "gutter-cleaning",
                sortOrder: 3,
                noindex: true,
            },
        ],
    },
    {
        name: "Vehicle & Equipment Cleaning",
        slug: "vehicle-equipment-cleaning",
        top: true,
        column: 1,
        sortOrder: 10,
        noindex: true,
    },
    {
        name: "Junk Removal",
        slug: "junk-removal",
        top: true,
        column: 1,
        sortOrder: 11,
        noindex: true,
    },
    {
        name: "Sewer Cleaning",
        slug: "sewer-cleaning",
        top: true,
        column: 1,
        sortOrder: 12,
        noindex: true,
    },
    {
        name: "Laundry",
        slug: "laundry",
        top: true,
        column: 1,
        sortOrder: 13,
        noindex: true,
    },
    {
        name: "Dry Cleaning",
        slug: "dry-cleaning",
        top: true,
        column: 1,
        sortOrder: 14,
        noindex: true,
    },
];

/** Рекурсивно вставляем категории и собираем id */
async function insertTree(
    items: SeedCategory[],
    parentId: number | null = null
): Promise<{ id: number; parentId: number | null }[]> {
    const result: { id: number; parentId: number | null }[] = [];

    for (const item of items) {
        const [row] = await db
            .insert(categories)
            .values({
                parentId,
                name: item.name,
                slug: item.slug,
                description: item.description ?? null,
                metaTitle: item.metaTitle ?? null,
                metaDescription: item.metaDescription ?? null,
                metaKeyword: item.metaKeyword ?? null,
                metaH1: item.metaH1 ?? null,
                top: item.top ?? false,
                column: item.column ?? 1,
                sortOrder: item.sortOrder ?? 0,
                status: item.status ?? true,
                noindex: item.noindex ?? false,
            })
            .returning({ id: categories.id });

        result.push({ id: row.id, parentId });

        if (item.children?.length) {
            const children = await insertTree(item.children, row.id);
            result.push(...children);
        }
    }

    return result;
}

/** Строим category_path как в OpenCart */
async function rebuildCategoryPath(
    all: { id: number; parentId: number | null }[]
) {
    const byId = new Map(all.map((c) => [c.id, c]));

    const paths: { categoryId: number; pathId: number; level: number }[] = [];

    for (const cat of all) {
        const chain: number[] = [];
        let current: { id: number; parentId: number | null } | undefined = cat;

        // поднимаемся к корню
        while (current) {
            chain.unshift(current.id);
            current =
                current.parentId != null ? byId.get(current.parentId) : undefined;
        }

        chain.forEach((pathId, level) => {
            paths.push({
                categoryId: cat.id,
                pathId,
                level,
            });
        });
    }

    if (paths.length) {
        await db.insert(categoryPath).values(paths);
    }
}

export async function seedCategories() {
    console.log("→ Seeding categories...");

    // если уже есть — пропускаем (идемпотентно)
    const existing = await db.query.categories.findFirst();
    if (existing) {
        console.log("  • Categories already exist — skip\n");
        return;
    }

    const inserted = await insertTree(SEED_CATEGORIES);
    await rebuildCategoryPath(inserted);

    console.log(`  ✓ ${inserted.length} categories + path built\n`);
}
