"use server";

import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";

import { requireAdmin, ADMIN_PAGE_SIZE } from "@/lib/admin";
import { revalidateCompanyPaths } from "@/lib/company-access";
import { db } from "@/db";
import {
    companies,
    users,
    companySourceEnum,
    moderationStatusEnum,
    type CompanySource,
    type ModerationStatus,
} from "@/db/schema";

export type AdminCompanyListItem = {
    id: number;
    name: string;
    slug: string;
    source: CompanySource;
    externalId: string | null;
    status: boolean;
    moderationStatus: ModerationStatus;
    sCity: string | null;
    updatedAt: Date;
    ownerId: string | null;
    ownerEmail: string | null;
    ownerName: string | null;
};

export type AdminCompanyListResult = {
    companies: AdminCompanyListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type AdminCompanyDetail = {
    id: number;
    userId: string | null;
    source: CompanySource;
    externalId: string | null;
    claimedAt: Date | null;
    entityType: string;
    legalName: string;
    dbaName: string | null;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    phone: string | null;
    email: string | null;
    ein: string | null;
    yearFounded: number | null;
    employeesCount: number | null;
    isInsured: boolean;
    isBonded: boolean;
    isLicensed: boolean;
    hqAddressLine1: string | null;
    hqCity: string | null;
    hqState: string | null;
    hqZip: string | null;
    sCity: string | null;
    sZips: string[];
    sArea: string | null;
    status: boolean;
    moderationStatus: ModerationStatus;
    moderationNote: string | null;
    viewed: number;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    owner: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    } | null;
};

function isCompanySource(value: string): value is CompanySource {
    return (companySourceEnum as readonly string[]).includes(value);
}

function isModerationStatus(value: string): value is ModerationStatus {
    return (moderationStatusEnum as readonly string[]).includes(value);
}

export async function getAdminCompanies(input: {
    q?: string;
    source?: string;
    moderation?: string;
    status?: string;
    claimed?: string;
    page?: number;
}): Promise<AdminCompanyListResult> {
    const session = await requireAdmin();
    if (!session) {
        return {
            companies: [],
            total: 0,
            page: 1,
            pageSize: ADMIN_PAGE_SIZE,
            totalPages: 1,
        };
    }

    const q = input.q?.trim() ?? "";
    const source = input.source && isCompanySource(input.source) ? input.source : undefined;
    const moderation =
        input.moderation && isModerationStatus(input.moderation)
            ? input.moderation
            : undefined;
    const page = Math.max(1, input.page ?? 1);
    const offset = (page - 1) * ADMIN_PAGE_SIZE;

    const filters = [];

    if (q) {
        const pattern = `%${q}%`;
        filters.push(
            or(
                ilike(companies.name, pattern),
                ilike(companies.legalName, pattern),
                ilike(companies.slug, pattern),
                ilike(companies.email, pattern),
                ilike(companies.phone, pattern),
                ilike(companies.externalId, pattern)
            )
        );
    }

    if (source) {
        filters.push(eq(companies.source, source));
    }

    if (moderation) {
        filters.push(eq(companies.moderationStatus, moderation));
    }

    if (input.status === "live") {
        filters.push(eq(companies.status, true));
    } else if (input.status === "hidden") {
        filters.push(eq(companies.status, false));
    }

    if (input.claimed === "1") {
        filters.push(isNotNull(companies.userId));
    } else if (input.claimed === "0") {
        filters.push(isNull(companies.userId));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalRow] = await db
        .select({ total: count() })
        .from(companies)
        .where(where);

    const total = Number(totalRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

    const rows = await db
        .select({
            id: companies.id,
            name: companies.name,
            slug: companies.slug,
            source: companies.source,
            externalId: companies.externalId,
            status: companies.status,
            moderationStatus: companies.moderationStatus,
            sCity: companies.sCity,
            updatedAt: companies.updatedAt,
            ownerId: users.id,
            ownerEmail: users.email,
            ownerName: users.name,
        })
        .from(companies)
        .leftJoin(users, eq(companies.userId, users.id))
        .where(where)
        .orderBy(desc(companies.updatedAt))
        .limit(ADMIN_PAGE_SIZE)
        .offset(offset);

    return {
        companies: rows,
        total,
        page,
        pageSize: ADMIN_PAGE_SIZE,
        totalPages,
    };
}

export async function getAdminCompanyById(
    id: number
): Promise<AdminCompanyDetail | null> {
    const session = await requireAdmin();
    if (!session) return null;

    const [row] = await db
        .select({
            company: companies,
            ownerId: users.id,
            ownerName: users.name,
            ownerEmail: users.email,
            ownerRole: users.role,
        })
        .from(companies)
        .leftJoin(users, eq(companies.userId, users.id))
        .where(eq(companies.id, id))
        .limit(1);

    if (!row) return null;

    const company = row.company;

    return {
        id: company.id,
        userId: company.userId,
        source: company.source,
        externalId: company.externalId,
        claimedAt: company.claimedAt,
        entityType: company.entityType,
        legalName: company.legalName,
        dbaName: company.dbaName,
        name: company.name,
        slug: company.slug,
        description: company.description,
        image: company.image,
        phone: company.phone,
        email: company.email,
        ein: company.ein,
        yearFounded: company.yearFounded,
        employeesCount: company.employeesCount,
        isInsured: company.isInsured,
        isBonded: company.isBonded,
        isLicensed: company.isLicensed,
        hqAddressLine1: company.hqAddressLine1,
        hqCity: company.hqCity,
        hqState: company.hqState,
        hqZip: company.hqZip,
        sCity: company.sCity,
        sZips: company.sZips ?? [],
        sArea: company.sArea,
        status: company.status,
        moderationStatus: company.moderationStatus,
        moderationNote: company.moderationNote,
        viewed: company.viewed,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        approvedAt: company.approvedAt,
        owner: row.ownerId
            ? {
                  id: row.ownerId,
                  name: row.ownerName,
                  email: row.ownerEmail ?? "",
                  role: row.ownerRole ?? "customer",
              }
            : null,
    };
}

export async function getAdminOverview() {
    const session = await requireAdmin();
    if (!session) {
        return { users: 0, companies: 0, unclaimed: 0, pending: 0 };
    }

    const [usersRow] = await db.select({ total: count() }).from(users);
    const [companiesRow] = await db.select({ total: count() }).from(companies);
    const [unclaimedRow] = await db
        .select({ total: count() })
        .from(companies)
        .where(isNull(companies.userId));
    const [pendingRow] = await db
        .select({ total: count() })
        .from(companies)
        .where(eq(companies.moderationStatus, "pending"));

    return {
        users: Number(usersRow?.total ?? 0),
        companies: Number(companiesRow?.total ?? 0),
        unclaimed: Number(unclaimedRow?.total ?? 0),
        pending: Number(pendingRow?.total ?? 0),
    };
}

export type AdminActionState = {
    error?: string;
    success?: boolean;
};

export type AdminProviderOption = {
    id: string;
    name: string | null;
    email: string;
};

export async function getAdminProviderOptions(): Promise<AdminProviderOption[]> {
    const session = await requireAdmin();
    if (!session) return [];

    return db.query.users.findMany({
        where: eq(users.role, "provider"),
        columns: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: [asc(users.email)],
        limit: 500,
    });
}

export async function updateAdminCompanyOwner(input: {
    companyId: number;
    userId: string | null;
}): Promise<AdminActionState> {
    const session = await requireAdmin();
    if (!session) return { error: "Unauthorized" };

    const companyId = input.companyId;
    if (!companyId || Number.isNaN(companyId)) {
        return { error: "Invalid company id" };
    }

    const existing = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: {
            id: true,
            slug: true,
            userId: true,
            claimedAt: true,
        },
    });

    if (!existing) {
        return { error: "Company not found" };
    }

    const nextUserId = input.userId?.trim() ? input.userId.trim() : null;

    if (nextUserId) {
        const owner = await db.query.users.findFirst({
            where: eq(users.id, nextUserId),
            columns: { id: true, role: true },
        });

        if (!owner) {
            return { error: "User not found" };
        }

        if (owner.role !== "provider") {
            return { error: "Owner must be a provider" };
        }
    }

    const claimedAt =
        nextUserId && !existing.claimedAt ? new Date() : existing.claimedAt;

    try {
        await db
            .update(companies)
            .set({
                userId: nextUserId,
                claimedAt,
                updatedAt: new Date(),
            })
            .where(eq(companies.id, companyId));

        revalidateCompanyPaths({
            companyId,
            slug: existing.slug,
            ownerId: existing.userId,
        });
        if (nextUserId && nextUserId !== existing.userId) {
            revalidateCompanyPaths({ companyId, ownerId: nextUserId });
        }

        return { success: true };
    } catch (err) {
        console.error("updateAdminCompanyOwner error:", err);
        return { error: "Failed to update owner" };
    }
}

export async function updateAdminCompanyModeration(input: {
    companyId: number;
    status: boolean;
    moderationStatus: ModerationStatus;
    moderationNote: string | null;
}): Promise<AdminActionState> {
    const session = await requireAdmin();
    if (!session) return { error: "Unauthorized" };

    const companyId = input.companyId;
    if (!companyId || Number.isNaN(companyId)) {
        return { error: "Invalid company id" };
    }

    if (!isModerationStatus(input.moderationStatus)) {
        return { error: "Invalid moderation status" };
    }

    const existing = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: {
            id: true,
            slug: true,
            userId: true,
            approvedAt: true,
            moderationStatus: true,
        },
    });

    if (!existing) {
        return { error: "Company not found" };
    }

    const note = input.moderationNote?.trim() ? input.moderationNote.trim() : null;
    const approvedAt =
        input.moderationStatus === "approved" && !existing.approvedAt
            ? new Date()
            : existing.approvedAt;

    try {
        await db
            .update(companies)
            .set({
                status: input.status,
                moderationStatus: input.moderationStatus,
                moderationNote: note,
                approvedAt,
                updatedAt: new Date(),
            })
            .where(eq(companies.id, companyId));

        revalidateCompanyPaths({
            companyId,
            slug: existing.slug,
            ownerId: existing.userId,
        });

        return { success: true };
    } catch (err) {
        console.error("updateAdminCompanyModeration error:", err);
        return { error: "Failed to update moderation" };
    }
}
