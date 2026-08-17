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
} from "@/db/schema";
import {
    getPrivateDownloadUrl,
    deletePrivateFile,
} from "@/lib/r2";
import { slugify } from "@/lib/utils";

import type { CompanyFormValues, CompanyCreateValues } from "@/lib/validations/company";
import type { DocumentType } from "@/db/schema";


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
            website: true,
            entityType: true,
            status: true,
            moderationStatus: true,
            moderationNote: true,
            createdAt: true,
            updatedAt: true,
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
                name: data.name,
                legalName: data.legalName,
                dbaName: data.dbaName ?? null,
                slug,
                description: data.description ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                website: data.website ?? null,
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
                website: data.website ?? null,
                entityType: data.entityType,
                ein: data.ein ?? null,
                image: data.image ?? null,
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