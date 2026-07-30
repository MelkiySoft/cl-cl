import { db } from "@/db";
import { categories, categoryPath } from "@/db/schema";

type SeedCategory = {
    name: string;
    slug: string;
    description?: string;
    top?: boolean;
    sortOrder?: number;
    children?: SeedCategory[];
};

const SEED_CATEGORIES: SeedCategory[] = [
    {
        name: "Residential Cleaning",
        slug: "residential-cleaning",
        description: "Cleaning services for homes and apartments",
        top: true,
        sortOrder: 1,
        children: [
            {
                name: "Apartment Cleaning",
                slug: "apartment-cleaning",
                sortOrder: 1,
            },
            {
                name: "House Cleaning",
                slug: "house-cleaning",
                sortOrder: 2,
            },
            {
                name: "Move-in / Move-out Cleaning",
                slug: "move-in-move-out-cleaning",
                sortOrder: 3,
            },
        ],
    },
    {
        name: "Commercial Cleaning",
        slug: "commercial-cleaning",
        description: "Cleaning services for offices and businesses",
        top: true,
        sortOrder: 2,
        children: [
            {
                name: "Office Cleaning",
                slug: "office-cleaning",
                sortOrder: 1,
            },
            {
                name: "Retail & Store Cleaning",
                slug: "retail-store-cleaning",
                sortOrder: 2,
            },
            {
                name: "Medical Facility Cleaning",
                slug: "medical-facility-cleaning",
                sortOrder: 3,
            },
        ],
    },
    {
        name: "Specialized Cleaning",
        slug: "specialized-cleaning",
        top: true,
        sortOrder: 3,
        children: [
            {
                name: "Carpet Cleaning",
                slug: "carpet-cleaning",
                sortOrder: 1,
            },
            {
                name: "Window Cleaning",
                slug: "window-cleaning",
                sortOrder: 2,
            },
            {
                name: "Post-Construction Cleaning",
                slug: "post-construction-cleaning",
                sortOrder: 3,
            },
        ],
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
                top: item.top ?? false,
                sortOrder: item.sortOrder ?? 0,
                status: true,
                noindex: false,
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
            current = current.parentId != null ? byId.get(current.parentId) : undefined;
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