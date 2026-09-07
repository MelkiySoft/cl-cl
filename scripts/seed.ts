import "dotenv/config";

import { seedUsers } from "./seed/users";
import { seedCategories } from "./seed/categories";
import { seedCompanies } from "./seed/companies";
import { seedBlogCategories } from "./seed/blog-categories";
import { seedArticles } from "./seed/articles";
import { seedAttributes } from "./seed/attributes";
import { truncateAppTables } from "./db-wipe";

async function main() {
    console.log("\n🌱 Starting seed...\n");

    await truncateAppTables();

    await seedUsers();
    await seedCategories();
    await seedAttributes();
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
