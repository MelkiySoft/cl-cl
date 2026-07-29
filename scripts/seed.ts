import "dotenv/config";

import { db } from "@/db";
import {
    users,
    accounts,
    sessions,
    verificationTokens,
} from "@/db/schema";

import { seedUsers } from "./seed/users";

async function clearDatabase() {
    console.log("→ Clearing tables...");

    // Порядок важен из-за foreign keys
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
    // await seedCategories();
    // await seedCompanies();

    console.log("🎉 Seed completed successfully!\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});