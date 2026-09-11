"use server";

import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
    companies,
    companyImages,
    companyToCategory,
    companyDocuments,
    companyHours,
    companyLinks,
} from "@/db/schema";
import { emptyWeeklyHours, formatTimeValue } from "@/lib/company-hours";
import {
    attributeInputsToRows,
    emptyAttributeInputs,
    rowsToAttributeInputs,
} from "@/lib/company-attributes";
import {
    getActiveAttributeDefinitions,
    getCompanyAttributeRows,
    replaceCompanyAttributeRows,
} from "@/lib/company-attributes-db";
import {
    getPrivateDownloadUrl,
    deletePrivateFile,
} from "@/lib/r2";
import { slugify } from "@/lib/utils";
import { formatServiceCityLabel, getGeoCityByExactLabel, getPublicCityByZip, normalizeZip } from "@/lib/geo";

import type { CompanyFormValues, CompanyCreateValues } from "@/lib/validations/company";
import type { CompanyLinkType, DocumentType } from "@/db/schema";


// ===================== COMPANIES =====================
export type CompanyFormState = {
    error?: string;
    success?: boolean;
};

/** Список компаний текущего провайдера */
export async function getMyCompanies() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return db.query.companies.findMany({
        where: eq(companies.userId, session.user.id),
        orderBy: [asc(companies.name)],
        columns: {
            id: true,
            name: true,
            slug: true,
            legalName: true,
            dbaName: true,
            description: true,
            image: true,
            phone: true,
            email: true,
            entityType: true,
            status: true,
            moderationStatus: true,
            moderationNote: true,
            createdAt: true,
            updatedAt: true,
        },
        with: {
            links: {
                columns: {
                    type: true,
                    url: true,
                    sortOrder: true,
                },
            },
        },
    });
}


/** Создание компании */
export async function createCompany(    data: CompanyCreateValues): Promise<CompanyFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "provider" && session.user.role !== "admin") {
        return { error: "Only providers can create companies" };
    }

    // Уникальный slug
    let baseSlug = slugify(data.name);
    if (!baseSlug) baseSlug = "company";

    let slug = baseSlug;
    let attempt = 0;

    while (true) {
        const existing = await db.query.companies.findFirst({
            where: eq(companies.slug, slug),
            columns: { id: true },
        });
        if (!existing) break;
        attempt += 1;
        slug = `${baseSlug}-${attempt}`;
        if (attempt > 50) {
            return { error: "Could not generate unique slug" };
        }
    }

    let createdId: number;

    try {
        const [created] = await db
            .insert(companies)
            .values({
                userId: session.user.id,
                source: "registered",
                externalId: null,
                claimedAt: null,
                name: data.name,
                legalName: data.legalName,
                dbaName: data.dbaName ?? null,
                slug,
                description: data.description ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                entityType: data.entityType,
                ein: data.ein ?? null,
                status: false,
                moderationStatus: "pending",
            })
            .returning({ id: companies.id });

        createdId = created.id;
    } catch (err) {
        console.error("createCompany error:", err);
        return { error: "Failed to create company" };
    }

    // redirect должен быть ВНЕ try/catch
    revalidatePath("/provider/company");
    redirect(`/provider/company/${createdId}`);
}

/** Получить компанию для редактирования (только свою) */
export async function getCompanyForEdit(id: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, id),
            eq(companies.userId, session.user.id)
        ),
    });

    return company ?? null;
}

/** Обновление компании */
export async function updateCompany(    data: CompanyFormValues): Promise<CompanyFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const id = data.id;
    if (!id || Number.isNaN(id)) {
        return { error: "Invalid company id" };
    }

    // Проверяем, что компания принадлежит текущему пользователю
    const existing = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, id),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true, slug: true },
    });

    if (!existing) {
        return { error: "Company not found" };
    }

    const serviceCity = await getGeoCityByExactLabel(data.sCity);
    if (!serviceCity) {
        return { error: "Unknown service city" };
    }

    const serviceZips = [
        ...new Set(
            data.sZips
                .map((zip) => normalizeZip(zip))
                .filter((zip): zip is string => Boolean(zip))
        ),
    ];
    if (serviceZips.length === 0) {
        return { error: "Add at least one service ZIP" };
    }

    for (const zip of serviceZips) {
        const zipCity = await getPublicCityByZip(zip);
        if (
            !zipCity ||
            formatServiceCityLabel(zipCity.city, zipCity.stateId) !== serviceCity.label
        ) {
            return { error: `ZIP ${zip} is not in ${serviceCity.label}` };
        }
    }

    if (data.hqZip) {
        const hqPublic = await getPublicCityByZip(data.hqZip);
        if (!hqPublic) {
            return { error: "Headquarters ZIP is not in a listed city" };
        }
        data.hqCity = hqPublic.city;
        data.hqState = hqPublic.stateId;
    }

    try {
        await db
            .update(companies)
            .set({
                name: data.name,
                legalName: data.legalName,
                dbaName: data.dbaName ?? null,
                description: data.description ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                entityType: data.entityType,
                ein: data.ein ?? null,
                yearFounded: data.yearFounded ?? null,
                employeesCount: data.employeesCount ?? null,
                businessStructure: data.businessStructure ?? null,
                image: data.image ?? null,
                hoursMode: data.hoursMode,
                hoursNote: data.hoursNote ?? null,
                hqAddressLine1: data.hqAddressLine1 ?? null,
                hqCity: data.hqCity ?? null,
                hqState: data.hqState ?? null,
                hqZip: data.hqZip ?? null,
                sCity: serviceCity.label,
                sZips: serviceZips,
                sArea: data.sArea ?? null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(companies.id, id),
                    eq(companies.userId, session.user.id)
                )
            );

        // --- Categories ---
        const leafIds = [
            data.mainCategoryId,
            data.extraCategoryId1,
            data.extraCategoryId2,
        ].filter((id): id is number => typeof id === "number" && id > 0);

        const uniqueLeafIds = [...new Set(leafIds)];

        if (uniqueLeafIds.length > 3) {
            return { error: "Maximum 3 categories" };
        }

        const { getLeafOptions } = await import("@/lib/provider-categories");
        const allLeaves = await getLeafOptions();
        const leafMap = new Map(allLeaves.map((l) => [l.id, l]));

        for (const lid of uniqueLeafIds) {
            if (!leafMap.has(lid)) {
                return { error: "Invalid category selected" };
            }
        }

        if (uniqueLeafIds.length > 0) {
            const roots = new Set(
                uniqueLeafIds.map((id) => leafMap.get(id)!.rootId)
            );
            if (roots.size > 1) {
                return { error: "Categories must be from the same branch" };
            }
        }

        const toLink = new Set<number>();
        for (const lid of uniqueLeafIds) {
            for (const pid of leafMap.get(lid)!.pathIds) {
                toLink.add(pid);
            }
        }

        await replaceCompanyHours(id, data);
        await replaceCompanyLinks(id, data);
        const attributesResult = await replaceCompanyAttributes(id, data);
        if (attributesResult.error) {
            return { error: attributesResult.error };
        }

        await db
            .delete(companyToCategory)
            .where(eq(companyToCategory.companyId, id));

        if (toLink.size > 0) {
            const mainLeaf =
                data.mainCategoryId && leafMap.has(data.mainCategoryId)
                    ? data.mainCategoryId
                    : uniqueLeafIds[0];

            await db.insert(companyToCategory).values(
                [...toLink].map((categoryId) => ({
                    companyId: id,
                    categoryId,
                    isMain: categoryId === mainLeaf,
                }))
            );
        }

        revalidatePath("/provider/company");
        revalidatePath(`/provider/company/${id}`);
        revalidatePath(`/company/${existing.slug}`);

        return { success: true };
    } catch (err) {
        console.error("updateCompany error:", err);
        return { error: "Failed to update company" };
    }
}


export async function getCompanyHoursForEdit(companyId: number) {
    const session = await auth();
    if (!session?.user?.id) return emptyWeeklyHours();

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) return emptyWeeklyHours();

    const rows = await db.query.companyHours.findMany({
        where: eq(companyHours.companyId, companyId),
        orderBy: [asc(companyHours.weekday), asc(companyHours.sortOrder)],
    });

    if (rows.length === 0) return emptyWeeklyHours();

    const firstByDay = new Map<number, (typeof rows)[number]>();
    for (const row of rows) {
        if (!firstByDay.has(row.weekday)) firstByDay.set(row.weekday, row);
    }

    return emptyWeeklyHours().map((slot) => {
        const row = firstByDay.get(slot.weekday);
        if (!row) return slot;
        return {
            weekday: row.weekday,
            openTime: formatTimeValue(row.openTime),
            closeTime: formatTimeValue(row.closeTime),
            isClosed: row.isClosed,
            sortOrder: row.sortOrder,
        };
    });
}

export async function getCompanyLinksForEdit(companyId: number) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) return [];

    return db.query.companyLinks.findMany({
        where: eq(companyLinks.companyId, companyId),
        orderBy: [asc(companyLinks.sortOrder), asc(companyLinks.id)],
        columns: {
            type: true,
            url: true,
            sortOrder: true,
        },
    });
}

async function replaceCompanyHours(
    companyId: number,
    data: CompanyFormValues
) {
    await db.delete(companyHours).where(eq(companyHours.companyId, companyId));

    if (data.hoursMode !== "weekly") return;

    const values = data.hours
        .filter((slot) => slot.isClosed || (slot.openTime && slot.closeTime))
        .map((slot) => ({
            companyId,
            weekday: slot.weekday,
            isClosed: slot.isClosed,
            openTime: slot.isClosed || !slot.openTime ? null : slot.openTime,
            closeTime: slot.isClosed || !slot.closeTime ? null : slot.closeTime,
            sortOrder: slot.sortOrder ?? 0,
        }));

    if (values.length > 0) {
        await db.insert(companyHours).values(values);
    }
}

async function replaceCompanyAttributes(
    companyId: number,
    data: CompanyFormValues
): Promise<{ error?: string }> {
    const defs = await getActiveAttributeDefinitions();
    const mapped = attributeInputsToRows(companyId, defs, data.attributes ?? []);
    if ("error" in mapped) return { error: mapped.error };
    await replaceCompanyAttributeRows(companyId, mapped.rows);
    return {};
}

export async function getCompanyAttributesForEdit(companyId: number) {
    const defs = await getActiveAttributeDefinitions();
    const session = await auth();
    if (!session?.user?.id) {
        return { definitions: defs, values: emptyAttributeInputs(defs) };
    }

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) {
        return { definitions: defs, values: emptyAttributeInputs(defs) };
    }

    const rows = await getCompanyAttributeRows(companyId);
    return {
        definitions: defs,
        values: rowsToAttributeInputs(defs, rows),
    };
}

async function replaceCompanyLinks(
    companyId: number,
    data: CompanyFormValues
) {
    await db.delete(companyLinks).where(eq(companyLinks.companyId, companyId));

    const values = data.links
        .filter((link) => Boolean(link.url && link.url.trim()))
        .map((link, index) => ({
            companyId,
            type: link.type as CompanyLinkType,
            url: link.url.trim(),
            sortOrder: link.type === "website" ? 0 : index + 1,
        }));

    if (values.length > 0) {
        await db.insert(companyLinks).values(values);
    }
}

// ===================== IMAGES =====================

/** Галерея компании (только своя) */
export async function getCompanyImages(companyId: number) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) return [];

    return db.query.companyImages.findMany({
        where: eq(companyImages.companyId, companyId),
        orderBy: [asc(companyImages.sortOrder), asc(companyImages.id)],
    });
}

export type GalleryState = {
    error?: string;
    success?: boolean;
    image?: {
        id: number;
        image: string;
        sortOrder: number;
    };
};

/** Добавить фото в галерею */
export async function addCompanyImage( companyId: number, imageUrl: string): Promise<GalleryState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (!companyId || !imageUrl.trim()) {
        return { error: "Invalid data" };
    }

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) {
        return { error: "Company not found" };
    }

    const existing = await db.query.companyImages.findMany({
        where: eq(companyImages.companyId, companyId),
        columns: { id: true },
    });

    if (existing.length >= 5) {
        return { error: "Maximum 5 gallery images" };
    }

    const maxSort = await db.query.companyImages.findFirst({
        where: eq(companyImages.companyId, companyId),
        orderBy: [desc(companyImages.sortOrder)],
        columns: { sortOrder: true },
    });

    try {
        const [row] = await db
            .insert(companyImages)
            .values({
                companyId,
                image: imageUrl.trim(),
                sortOrder: (maxSort?.sortOrder ?? -1) + 1,
            })
            .returning({
                id: companyImages.id,
                image: companyImages.image,
                sortOrder: companyImages.sortOrder,
            });

        revalidatePath(`/provider/company/${companyId}`);
        return { success: true, image: row };
    } catch (err) {
        console.error("addCompanyImage error:", err);
        return { error: "Failed to add image" };
    }
}

/** Удалить фото из галереи */
export async function deleteCompanyImage( companyId: number, imageId: number ): Promise<GalleryState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (!companyId || !imageId) {
        return { error: "Invalid data" };
    }

    const company = await db.query.companies.findFirst({
        where: and(
            eq(companies.id, companyId),
            eq(companies.userId, session.user.id)
        ),
        columns: { id: true },
    });
    if (!company) {
        return { error: "Company not found" };
    }

    try {
        await db
            .delete(companyImages)
            .where(
                and(
                    eq(companyImages.id, imageId),
                    eq(companyImages.companyId, companyId)
                )
            );

        revalidatePath(`/provider/company/${companyId}`);
        return { success: true };
    } catch (err) {
        console.error("deleteCompanyImage error:", err);
        return { error: "Failed to delete image" };
    }
}

// ===================== DOCUMENTS =====================

export type DocumentState = {
    error?: string;
    success?: boolean;
    document?: {
        id: number;
        type: DocumentType;
        originalName: string;
        contentType: string;
        fileSize: number | null;
        status: string;
        uploadedAt: Date;
    };
};

/** Список документов компании (только владелец или admin) */
export async function getCompanyDocuments(companyId: number) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const company = await db.query.companies.findFirst({
        where:
            session.user.role === "admin"
                ? eq(companies.id, companyId)
                : and(
                    eq(companies.id, companyId),
                    eq(companies.userId, session.user.id)
                ),
        columns: { id: true },
    });
    if (!company) return [];

    return db.query.companyDocuments.findMany({
        where: eq(companyDocuments.companyId, companyId),
        orderBy: [desc(companyDocuments.uploadedAt)],
        columns: {
            id: true,
            type: true,
            originalName: true,
            contentType: true,
            fileSize: true,
            status: true,
            adminNote: true,
            uploadedAt: true,
            reviewedAt: true,
        },
    });
}

/** Сохранить документ после успешной загрузки в R2 */
export async function saveCompanyDocument(input: {
    companyId: number;
    type: DocumentType;
    fileKey: string;
    originalName: string;
    contentType: string;
    fileSize?: number;
}): Promise<DocumentState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const company = await db.query.companies.findFirst({
        where:
            session.user.role === "admin"
                ? eq(companies.id, input.companyId)
                : and(
                    eq(companies.id, input.companyId),
                    eq(companies.userId, session.user.id)
                ),
        columns: { id: true },
    });
    if (!company) {
        return { error: "Company not found" };
    }

    try {
        const [row] = await db
            .insert(companyDocuments)
            .values({
                companyId: input.companyId,
                type: input.type,
                fileKey: input.fileKey,
                originalName: input.originalName,
                contentType: input.contentType,
                fileSize: input.fileSize ?? null,
                status: "pending",
            })
            .returning({
                id: companyDocuments.id,
                type: companyDocuments.type,
                originalName: companyDocuments.originalName,
                contentType: companyDocuments.contentType,
                fileSize: companyDocuments.fileSize,
                status: companyDocuments.status,
                uploadedAt: companyDocuments.uploadedAt,
            });

        revalidatePath(`/provider/company/${input.companyId}`);
        return { success: true, document: row };
    } catch (err) {
        console.error("saveCompanyDocument error:", err);
        return { error: "Failed to save document" };
    }
}

/** Временная ссылка на скачивание (owner или admin) */
export async function getDocumentDownloadUrl(
    companyId: number,
    documentId: number
): Promise<{ url?: string; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const company = await db.query.companies.findFirst({
        where:
            session.user.role === "admin"
                ? eq(companies.id, companyId)
                : and(
                    eq(companies.id, companyId),
                    eq(companies.userId, session.user.id)
                ),
        columns: { id: true },
    });
    if (!company) {
        return { error: "Company not found" };
    }

    const doc = await db.query.companyDocuments.findFirst({
        where: and(
            eq(companyDocuments.id, documentId),
            eq(companyDocuments.companyId, companyId)
        ),
        columns: { fileKey: true },
    });
    if (!doc) {
        return { error: "Document not found" };
    }

    try {
        const url = await getPrivateDownloadUrl(doc.fileKey, 60 * 10);
        return { url };
    } catch (err) {
        console.error("getDocumentDownloadUrl error:", err);
        return { error: "Failed to generate download URL" };
    }
}

/** Удалить документ (файл из R2 + запись из БД) */
export async function deleteCompanyDocument(
    companyId: number,
    documentId: number
): Promise<DocumentState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const company = await db.query.companies.findFirst({
        where:
            session.user.role === "admin"
                ? eq(companies.id, companyId)
                : and(
                    eq(companies.id, companyId),
                    eq(companies.userId, session.user.id)
                ),
        columns: { id: true },
    });
    if (!company) {
        return { error: "Company not found" };
    }

    const doc = await db.query.companyDocuments.findFirst({
        where: and(
            eq(companyDocuments.id, documentId),
            eq(companyDocuments.companyId, companyId)
        ),
        columns: { id: true, fileKey: true },
    });
    if (!doc) {
        return { error: "Document not found" };
    }

    try {
        await deletePrivateFile(doc.fileKey);
        await db
            .delete(companyDocuments)
            .where(eq(companyDocuments.id, documentId));

        revalidatePath(`/provider/company/${companyId}`);
        return { success: true };
    } catch (err) {
        console.error("deleteCompanyDocument error:", err);
        return { error: "Failed to delete document" };
    }
}
