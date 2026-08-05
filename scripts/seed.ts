import "dotenv/config";

import { db } from "@/db";
import {
    users,
    accounts,
    sessions,
    verificationTokens,
    categories,
    categoryPath,
    companyToCategory,
    companyImages,
    companies,
    // blog
    articleToCategory,
    articles,
    blogCategoryPath,
    blogCategories,
} from "@/db/schema";

import { seedUsers } from "./seed/users";
import { seedCategories } from "./seed/categories";
import { seedCompanies } from "./seed/companies";
import { seedBlogCategories } from "./seed/blog-categories";
import { seedArticles } from "./seed/articles";

async function clearDatabase() {
    console.log("→ Clearing tables...");

    await db.delete(articleToCategory);
    await db.delete(articles);
    await db.delete(blogCategoryPath);
    await db.delete(blogCategories);

    await db.delete(companyToCategory);
    await db.delete(companyImages);
    await db.delete(companies);

    await db.delete(categoryPath);
    await db.delete(categories);

    await db.delete(verificationTokens);
    await db.delete(sessions);
    await db.delete(accounts);
    await db.delete(users);

    console.log("✓ Tables cleared\n");
}

async function main() {
    console.log("\n🌱 Starting seed...\n");

    await clearDatabase();

    await seedUsers();
    await seedCategories();
    await seedCompanies();

    await seedBlogCategories();
    await seedArticles();

    console.log("🎉 Seed completed successfully!\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});