import { db } from "@/db";
import { blogCategories, blogCategoryPath } from "@/db/schema";

type SeedBlogCategory = {
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
    children?: SeedBlogCategory[];
};

/**
 * Категории блога (пока без картинок).
 */
const SEED_BLOG_CATEGORIES: SeedBlogCategory[] = [
    {
        name: "Cleaning Tips",
        slug: "cleaning-tips",
        top: true,
        column: 1,
        sortOrder: 1,
        description: "Practical tips for everyday and deep cleaning.",
        children: [
            {
                name: "Kitchen Cleaning",
                slug: "kitchen-cleaning",
                sortOrder: 1,
            },
            {
                name: "Bathroom Cleaning",
                slug: "bathroom-cleaning",
                sortOrder: 2,
            },
            {
                name: "Bedroom & Living Room",
                slug: "bedroom-living-room",
                sortOrder: 3,
            },
            {
                name: "Eco-Friendly Tips",
                slug: "eco-friendly-tips",
                sortOrder: 4,
            },
        ],
    },
    {
        name: "How-to Guides",
        slug: "how-to-guides",
        top: true,
        column: 1,
        sortOrder: 2,
        description: "Step-by-step guides for cleaning tasks.",
        children: [
            {
                name: "Deep Cleaning Guides",
                slug: "deep-cleaning-guides",
                sortOrder: 1,
            },
            {
                name: "Move-in / Move-out",
                slug: "move-in-move-out",
                sortOrder: 2,
            },
        ],
    },
    {
        name: "Seasonal Cleaning",
        slug: "seasonal-cleaning",
        top: true,
        column: 1,
        sortOrder: 3,
    },
    {
        name: "Industry Insights",
        slug: "industry-insights",
        top: true,
        column: 1,
        sortOrder: 4,
        description: "News and trends in the cleaning industry.",
    },
    {
        name: "Home Maintenance",
        slug: "home-maintenance",
        top: false,
        column: 1,
        sortOrder: 5,
    },
    // -------------------------------------------------------
    // Служебная категория для важных страниц
    // -------------------------------------------------------
    {
        name: "Info",
        slug: "info",
        top: false,
        column: 1,
        sortOrder: 10,
        description: "About us, contact and legal information",
        noindex: false,
    },
];

/** Рекурсивно вставляем категории и собираем id */
async function insertTree(
    items: SeedBlogCategory[],
    parentId: number | null = null
): Promise<{ id: number; parentId: number | null }[]> {
    const result: { id: number; parentId: number | null }[] = [];

    for (const item of items) {
        const [row] = await db
            .insert(blogCategories)
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
            .returning({ id: blogCategories.id });

        result.push({ id: row.id, parentId });

        if (item.children?.length) {
            const children = await insertTree(item.children, row.id);
            result.push(...children);
        }
    }

    return result;
}

/** Строим blog_category_path */
async function rebuildBlogCategoryPath(
    all: { id: number; parentId: number | null }[]
) {
    const byId = new Map(all.map((c) => [c.id, c]));

    const paths: { categoryId: number; pathId: number; level: number }[] = [];

    for (const cat of all) {
        const chain: number[] = [];
        let current: { id: number; parentId: number | null } | undefined = cat;

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
        await db.insert(blogCategoryPath).values(paths);
    }
}

export async function seedBlogCategories() {
    console.log("→ Seeding blog categories...");

    const existing = await db.query.blogCategories.findFirst();
    if (existing) {
        console.log("  • Blog categories already exist — skip\n");
        return;
    }

    const inserted = await insertTree(SEED_BLOG_CATEGORIES);
    await rebuildBlogCategoryPath(inserted);

    console.log(`  ✓ ${inserted.length} blog categories + path built\n`);
}