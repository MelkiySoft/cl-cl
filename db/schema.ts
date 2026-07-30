import {
    pgTable,
    text,
    timestamp,
    integer,
    serial,
    boolean,
    primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================
// Auth User
// ============================================================

export const userRoleEnum = ["customer", "provider", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const users = pgTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    role: text("role").$type<UserRole>().notNull().default("customer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const accounts = pgTable("accounts", {
    userId: text("user_id")
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
},(account) => [
    primaryKey({
        columns: [account.provider, account.providerAccountId],
    }),
]);
export const sessions = pgTable("sessions",{
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});
export const verificationTokens = pgTable("verification_tokens", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => [
    primaryKey({
        columns: [vt.identifier, vt.token],
    }),
]);

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
}));
export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// ============================================================
// Categories
// ============================================================

export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),

    parentId: integer("parent_id"), // null = корень

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),

    description: text("description"),

    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeyword: text("meta_keyword"),
    metaH1: text("meta_h1"),

    image: text("image"),

    top: boolean("top").notNull().default(false),       // в верхнем меню
    column: integer("column").notNull().default(1),     // колонки мега-меню
    sortOrder: integer("sort_order").notNull().default(0),

    status: boolean("status").notNull().default(true),
    noindex: boolean("noindex").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const categoryPath = pgTable("category_path", {
    categoryId: integer("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
    pathId: integer("path_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
}, (t) => [
    primaryKey({ columns: [t.categoryId, t.pathId] }),
]);
export const companyToCategory = pgTable("company_to_category", {
    companyId: integer("company_id")
        .notNull()
        .references(() => companies.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
    isMain: boolean("is_main").notNull().default(false),
}, (t) => [
    primaryKey({ columns: [t.companyId, t.categoryId] }),
]);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "category_parent",
    }),
    children: many(categories, {
        relationName: "category_parent",
    }),
    paths: many(categoryPath),
    companyLinks: many(companyToCategory),
}));
export const categoryPathRelations = relations(categoryPath, ({ one }) => ({
    category: one(categories, {
        fields: [categoryPath.categoryId],
        references: [categories.id],
    }),
    path: one(categories, {
        fields: [categoryPath.pathId],
        references: [categories.id],
    }),
}));


// ============================================================
// Companies
// ============================================================

export const entityTypeEnum = ["individual", "company"] as const;
export type EntityType = (typeof entityTypeEnum)[number];
export const businessStructureEnum = [
    "sole_proprietorship",
    "llc",
    "corporation",
    "partnership",
    "other",
] as const;
export type BusinessStructure = (typeof businessStructureEnum)[number];
export const moderationStatusEnum = [
    "pending",
    "approved",
    "rejected",
] as const;
export type ModerationStatus = (typeof moderationStatusEnum)[number];

export const companies = pgTable("companies", {
    id: serial("id").primaryKey(),

    // владелец (provider)
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    // человек или компания
    entityType: text("entity_type")
        .$type<EntityType>()
        .notNull()
        .default("company"),

    // названия
    legalName: text("legal_name").notNull(), // официальное имя / ФИО
    dbaName: text("dba_name"), // Doing Business As (если есть)
    name: text("name").notNull(), // отображаемое имя в каталоге
    slug: text("slug").notNull().unique(),

    description: text("description"),

    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeyword: text("meta_keyword"),
    metaH1: text("meta_h1"),

    // главное фото / лого
    image: text("image"),

    // контакты
    phone: text("phone"),
    email: text("email"),
    website: text("website"),

    // US tax / business identifiers
    // В продакшене SSN/ITIN лучше шифровать (pgcrypto / app-level)
    ein: text("ein"), // Employer Identification Number (XX-XXXXXXX)
    ssn: text("ssn"), // Social Security Number (для sole prop)
    itin: text("itin"), // Individual Taxpayer Identification Number
    businessStructure: text("business_structure").$type<BusinessStructure>(),

    yearFounded: integer("year_founded"),
    employeesCount: integer("employees_count"), // примерное кол-во

    isInsured: boolean("is_insured").notNull().default(false),
    isBonded: boolean("is_bonded").notNull().default(false),
    isLicensed: boolean("is_licensed").notNull().default(false),

    // адрес (упрощённо, geo-таблицы — следующим шагом)
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"), // CA, NY, TX...
    zip: text("zip"),
    country: text("country").notNull().default("US"),

    // координаты (для карты позже)
    latitude: text("latitude"), // или numeric — пока text/null
    longitude: text("longitude"),

    // каталог / модерация
    status: boolean("status").notNull().default(false), // показывать в каталоге
    moderationStatus: text("moderation_status")
        .$type<ModerationStatus>()
        .notNull()
        .default("pending"),
    moderationNote: text("moderation_note"),

    sortOrder: integer("sort_order").notNull().default(0),
    viewed: integer("viewed").notNull().default(0),
    noindex: boolean("noindex").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { mode: "date" }),
});
export const companyImages = pgTable("company_images",{
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
        .notNull()
        .references(() => companies.id, { onDelete: "cascade" }),
    image: text("image").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
    owner: one(users, {
        fields: [companies.userId],
        references: [users.id],
    }),
    images: many(companyImages),
    categories: many(companyToCategory),
}));
export const companyImagesRelations = relations(companyImages, ({ one }) => ({
    company: one(companies, {
        fields: [companyImages.companyId],
        references: [companies.id],
    }),
}));
export const companyToCategoryRelations = relations(companyToCategory, ({ one }) => ({
    company: one(companies, {
        fields: [companyToCategory.companyId],
        references: [companies.id],
    }),
    category: one(categories, {
        fields: [companyToCategory.categoryId],
        references: [categories.id],
    }),
}));