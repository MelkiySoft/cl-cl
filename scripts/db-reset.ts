import "dotenv/config";

import { spawn } from "node:child_process";

import { dropAppTables } from "./db-wipe";

function run(command: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            shell: process.platform === "win32",
        });

        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
        });
    });
}

async function main() {
    console.log("\n🔁 Resetting app schema (geo_usa is kept)\n");

    await dropAppTables();

    // schema.ts → живая БД. Миграции drizzle не используются.
    await run("pnpm", ["exec", "drizzle-kit", "push", "--force"]);

    await run("pnpm", ["db:seed"]);

    console.log("🎉 Database reset completed\n");

    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});
