"use server";

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { requireAdmin, ADMIN_PAGE_SIZE, isUserRole } from "@/lib/admin";
import { db } from "@/db";
import { companies, users, type UserRole } from "@/db/schema";

export type AdminUserListItem = {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    emailVerified: Date | null;
    createdAt: Date;
    companiesCount: number;
};

export type AdminUserListResult = {
    users: AdminUserListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type AdminUserCompanyPreview = {
    id: number;
    name: string;
    slug: string;
    source: string;
    status: boolean;
    moderationStatus: string;
    sCity: string | null;
    updatedAt: Date;
};

export type AdminUserDetail = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: UserRole;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
    companies: AdminUserCompanyPreview[];
};

export async function getAdminUsers(input: {
    q?: string;
    role?: string;
    page?: number;
}): Promise<AdminUserListResult> {
    const session = await requireAdmin();
    if (!session) {
        return { users: [], total: 0, page: 1, pageSize: ADMIN_PAGE_SIZE, totalPages: 1 };
    }

    const q = input.q?.trim() ?? "";
    const role = input.role && isUserRole(input.role) ? input.role : undefined;
    const page = Math.max(1, input.page ?? 1);
    const offset = (page - 1) * ADMIN_PAGE_SIZE;

    const filters = [];

    if (q) {
        const pattern = `%${q}%`;
        filters.push(
            or(
                ilike(users.email, pattern),
                ilike(users.name, pattern),
                eq(users.id, q)
            )
        );
    }

    if (role) {
        filters.push(eq(users.role, role));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalRow] = await db
        .select({ total: count() })
        .from(users)
        .where(where);

    const total = Number(totalRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

    const companyCount = db
        .select({
            userId: companies.userId,
            total: count().as("total"),
        })
        .from(companies)
        .groupBy(companies.userId)
        .as("company_count");

    const rows = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            emailVerified: users.emailVerified,
            createdAt: users.createdAt,
            companiesCount: sql<number>`coalesce(${companyCount.total}, 0)`,
        })
        .from(users)
        .leftJoin(companyCount, eq(companyCount.userId, users.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(ADMIN_PAGE_SIZE)
        .offset(offset);

    return {
        users: rows.map((row) => ({
            ...row,
            companiesCount: Number(row.companiesCount ?? 0),
        })),
        total,
        page,
        pageSize: ADMIN_PAGE_SIZE,
        totalPages,
    };
}

export async function getAdminUserById(id: string): Promise<AdminUserDetail | null> {
    const session = await requireAdmin();
    if (!session) return null;

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) return null;

    const userCompanies = await db.query.companies.findMany({
        where: eq(companies.userId, id),
        columns: {
            id: true,
            name: true,
            slug: true,
            source: true,
            status: true,
            moderationStatus: true,
            sCity: true,
            updatedAt: true,
        },
        orderBy: [desc(companies.updatedAt)],
    });

    return {
        ...user,
        companies: userCompanies,
    };
}
