import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
    users,
    articles,
    articleToCategory,
    blogCategories,
} from "@/db/schema";

const ARTICLE_IMAGES = [
    "/demo/article1.jpg",
    "/demo/article2.jpg",
    "/demo/article3.jpg",
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// Шаблоны для dummy-статей
// ============================================================

type Template = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
};

const TEMPLATES: Template[] = [
    {
        title: "10 Tips for a Sparkling Clean Kitchen",
        slug: "10-tips-sparkling-clean-kitchen",
        excerpt: "Simple daily habits and deep-cleaning tricks that keep your kitchen looking brand new.",
        content: `A clean kitchen is the heart of a healthy home. Here are 10 practical tips that make a real difference.

## 1. Start with the sink
Wipe it down every evening. A clean sink makes the whole kitchen feel fresher.

## 2. Declutter the counters
Keep only the essentials on the countertops. Everything else goes in cabinets.

## 3. Clean as you cook
Wipe spills immediately. It saves a lot of time later.`,
    },
    {
        title: "How to Deep Clean Your Bathroom in 30 Minutes",
        slug: "deep-clean-bathroom-30-minutes",
        excerpt: "A fast and effective routine that leaves your bathroom looking hotel-fresh.",
        content: `You don't need hours to get a sparkling bathroom. Follow this 30-minute system.

**Step 1 (5 min)** – Remove everything from surfaces and put towels in the wash.
**Step 2 (10 min)** – Spray cleaner on the shower, toilet, sink and let it sit.
**Step 3 (10 min)** – Scrub and wipe everything down.
**Step 4 (5 min)** – Mop the floor and put fresh towels.`,
    },
    {
        title: "Eco-Friendly Cleaning Products That Actually Work",
        slug: "eco-friendly-cleaning-products",
        excerpt: "Green alternatives that clean just as well as conventional chemicals.",
        content: `Many people think eco-friendly means less effective. That's no longer true.

Vinegar, baking soda, castile soap and modern plant-based formulas can handle almost any job.`,
    },
    {
        title: "Move-Out Cleaning Checklist for Renters",
        slug: "move-out-cleaning-checklist",
        excerpt: "The ultimate list that helps you get your full deposit back.",
        content: `Landlords notice everything. Use this checklist so nothing is missed:

- Kitchen: oven, fridge, cabinets inside and out
- Bathroom: shower, toilet, exhaust fan
- Floors and baseboards
- Windows and tracks
- Closets and shelves`,
    },
    {
        title: "Spring Cleaning: Where to Start and What to Skip",
        slug: "spring-cleaning-where-to-start",
        excerpt: "A realistic spring cleaning plan that doesn't burn you out.",
        content: `Spring cleaning doesn't have to mean cleaning the entire house in one weekend.

Focus on high-impact areas first: kitchen, bathrooms and entryways.`,
    },
    {
        title: "How Often Should You Clean Different Rooms?",
        slug: "how-often-clean-rooms",
        excerpt: "A practical schedule for busy households.",
        content: `Not every room needs the same attention.

**Daily**: kitchen counters, dishes, bathroom sink  
**Weekly**: floors, bathrooms, bedrooms  
**Monthly**: fridge, oven, windows  
**Seasonally**: deep clean, carpets, closets`,
    },
    {
        title: "The Best Way to Clean Hardwood Floors",
        slug: "best-way-clean-hardwood-floors",
        excerpt: "Protect your floors while keeping them looking great.",
        content: `Hardwood needs gentle care. Avoid too much water and harsh chemicals.

Use a microfiber mop and a cleaner designed for wood.`,
    },
    {
        title: "5 Common Cleaning Mistakes Homeowners Make",
        slug: "5-common-cleaning-mistakes",
        excerpt: "Stop doing these things — they waste time and can damage surfaces.",
        content: `1. Using too much product  
2. Cleaning from bottom to top  
3. Ignoring microfiber cloths  
4. Mixing chemicals  
5. Never deep-cleaning appliances`,
    },
    {
        title: "How Professional Cleaners Organize Their Day",
        slug: "how-professional-cleaners-organize",
        excerpt: "Time-saving systems used by cleaning companies.",
        content: `Pros work in a specific order and use the right tools for each surface. The biggest secret is preparation and a consistent system.`,
    },
    {
        title: "Winter Cleaning Tips for a Cozier Home",
        slug: "winter-cleaning-tips",
        excerpt: "Keep your home fresh when you spend more time indoors.",
        content: `In winter we track in more dirt and the air gets drier. Focus on entryways, heating vents and humidity levels.`,
    },
];

// ============================================================
// Важные статьи (категория Info)
// ============================================================

const INFO_ARTICLES = [
    {
        title: "About Us",
        slug: "about",
        excerpt: "Learn more about our mission and the team behind the cleaning directory.",
        content: `We are building the most useful directory of cleaning companies in the United States.

Our goal is to help homeowners and businesses easily find trusted, professional cleaning services near them, while giving cleaning companies a simple way to present themselves online.

This page will be expanded with more details about our team and values.`,
    },
    {
        title: "Contact",
        slug: "contact",
        excerpt: "Get in touch with us. We are happy to answer your questions.",
        content: `Have a question or feedback? We would love to hear from you.

**Email:** support@example.com  
**Phone:** (555) 123-4567  

You can also reach us through the contact form (coming soon).

We usually respond within 1–2 business days.`,
    },
    {
        title: "Privacy Policy",
        slug: "privacy-policy",
        excerpt: "How we collect, use and protect your personal information.",
        content: `This Privacy Policy describes how we collect, use and share information when you use our website.

**Information we collect**
- Account information (name, email)
- Usage data and cookies
- Information you submit in forms

**How we use information**
- To provide and improve the service
- To communicate with you
- To comply with legal obligations

We do not sell your personal data. Full policy text will be added later.`,
    },
    {
        title: "Terms of Service",
        slug: "terms-of-service",
        excerpt: "The rules and conditions for using our website and services.",
        content: `By accessing or using this website you agree to these Terms of Service.

**Accounts**
You are responsible for keeping your account credentials secure.

**Content**
Companies are responsible for the accuracy of the information they publish.

**Limitation of liability**
We provide the directory "as is" and are not responsible for the quality of services provided by listed companies.

Full legal text will be added later.`,
    },
];

const DUMMY_COUNT = 100;

export async function seedArticles() {
    console.log("→ Seeding articles...");

    const existing = await db.query.articles.findFirst();
    if (existing) {
        console.log("  • Articles already exist — skip\n");
        return;
    }

    // Admin as author
    const admin = await db.query.users.findFirst({
        where: eq(users.email, "admin1@op.com"),
    });

    if (!admin) {
        console.log("  ✗ Admin user not found — run seedUsers first\n");
        return;
    }

    // Все категории блога
    const allCats = await db.query.blogCategories.findMany({
        columns: { id: true, slug: true },
    });

    if (allCats.length === 0) {
        console.log("  ✗ No blog categories found — run seedBlogCategories first\n");
        return;
    }

    const catBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c.id]));

    // Категории для dummy (без info)
    const dummyCats = allCats.filter((c) => c.slug !== "info");
    if (dummyCats.length === 0) {
        console.log("  ✗ No categories for dummy articles\n");
        return;
    }

    const now = new Date();

    // -------------------------------------------------------
    // 1. 100 dummy-статей
    // -------------------------------------------------------
    console.log(`  • Generating ${DUMMY_COUNT} dummy articles...`);

    for (let i = 1; i <= DUMMY_COUNT; i++) {
        const tpl = TEMPLATES[(i - 1) % TEMPLATES.length];
        const image = pick(ARTICLE_IMAGES);

        // разброс дат
        const publishedAt = new Date(now);
        publishedAt.setDate(publishedAt.getDate() - Math.floor(Math.random() * 90));

        const [article] = await db
            .insert(articles)
            .values({
                authorId: admin.id,
                title: `${tpl.title} ${i}`,
                slug: `${tpl.slug}-${i}`,
                excerpt: tpl.excerpt,
                content: tpl.content,
                image,
                metaTitle: `${tpl.title} ${i}`,
                metaDescription: tpl.excerpt,
                status: true,
                publishedAt,
                sortOrder: 0,
                viewed: Math.floor(Math.random() * 500) + 10,
                noindex: false,
            })
            .returning({ id: articles.id });

        // 1–2 случайные категории (не info)
        const cat1 = pick(dummyCats);
        const links: {
            articleId: number;
            categoryId: number;
            isMain: boolean;
        }[] = [
            {
                articleId: article.id,
                categoryId: cat1.id,
                isMain: true,
            },
        ];

        if (Math.random() > 0.55) {
            const cat2 = pick(dummyCats);
            if (cat2.id !== cat1.id) {
                links.push({
                    articleId: article.id,
                    categoryId: cat2.id,
                    isMain: false,
                });
            }
        }

        await db.insert(articleToCategory).values(links);
    }

    console.log(`  ✓ ${DUMMY_COUNT} dummy articles created`);

    // -------------------------------------------------------
    // 2. Важные статьи → категория Info
    // -------------------------------------------------------
    const infoCategoryId = catBySlug["info"];
    if (!infoCategoryId) {
        console.log("  ✗ Category 'info' not found — important articles skipped\n");
        return;
    }

    console.log("  • Seeding important Info articles...");

    for (const item of INFO_ARTICLES) {
        const image = pick(ARTICLE_IMAGES);

        const [article] = await db
            .insert(articles)
            .values({
                authorId: admin.id,
                title: item.title,
                slug: item.slug,
                excerpt: item.excerpt,
                content: item.content,
                image,
                metaTitle: item.title,
                metaDescription: item.excerpt,
                status: true,
                publishedAt: now,
                sortOrder: 0,
                viewed: 0,
                noindex: false,
            })
            .returning({ id: articles.id });

        await db.insert(articleToCategory).values({
            articleId: article.id,
            categoryId: infoCategoryId,
            isMain: true,
        });
    }

    console.log(`  ✓ ${INFO_ARTICLES.length} Info articles created\n`);
}