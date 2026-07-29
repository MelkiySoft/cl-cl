import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

const SEED_USERS = [
    {
        name: "Admin1",
        email: "admin1@op.com",
        password: "111111",
        role: "admin" as const,
    },
    {
        name: "Customer1",
        email: "customer1@op.com",
        password: "111111",
        role: "customer" as const,
    },
    {
        name: "Provider1",
        email: "provider1@op.com",
        password: "111111",
        role: "provider" as const,
    },
    {
        name: "Provider2",
        email: "provider2@op.com",
        password: "111111",
        role: "provider" as const,
    },
    {
        name: "Provider3",
        email: "provider3@op.com",
        password: "111111",
        role: "provider" as const,
    },
];

export async function seedUsers() {
    console.log("→ Seeding users...");

    for (const u of SEED_USERS) {
        const existing = await db.query.users.findFirst({
            where: eq(users.email, u.email),
        });

        if (existing) {
            console.log(`  • ${u.email} уже существует — пропускаем`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(u.password, 12);

        await db.insert(users).values({
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            emailVerified: new Date(), // сразу подтверждённый
        });

        console.log(`  ✓ ${u.email} (${u.role})`);
    }

    console.log("✓ Users seeded\n");
}