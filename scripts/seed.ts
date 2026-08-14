import "dotenv/config";

import { db } from "@/db";
import { sql } from "drizzle-orm";

import { seedUsers } from "./seed/users";
import { seedCategories } from "./seed/categories";
import { seedCompanies } from "./seed/companies";
import { seedBlogCategories } from "./seed/blog-categories";
import { seedArticles } from "./seed/articles";

async function clearDatabase() {
    console.log("→ Clearing tables...");

    await db.execute(sql`
    TRUNCATE TABLE
        
      article_to_category,
      articles,
      blog_category_path,
      blog_categories,
        
      company_to_category,
      company_images,
      companies,
        
      category_path,
      categories,
        
      verification_tokens,
      sessions,
      accounts,
      users
        
    RESTART IDENTITY CASCADE
  `);

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