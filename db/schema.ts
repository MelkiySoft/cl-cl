import {
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    primaryKey,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// Роли
export const userRoleEnum = ["customer", "provider", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"), // для credentials-провайдера
    role: text("role").$type<UserRole>().notNull().default("customer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
    "accounts",
    {
        userId: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("provider_account_id").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => [
        primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    ]
);

export const sessions = pgTable("sessions", {
    sessionToken: text("session_token").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verification_tokens",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => [
        primaryKey({ columns: [vt.identifier, vt.token] }),
    ]
);

// Relations (по желанию, но удобно)
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
}));