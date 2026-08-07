"use server";

import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyImages, companyToCategory } from "@/db/schema";
import { slugify } from "@/lib/utils";


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
export async function createCompany(
    _prevState: CompanyFormState,
    formData: FormData
): Promise<CompanyFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "provider" && session.user.role !== "admin") {
        return { error: "Only providers can create companies" };
    }

    const name = (formData.get("name") as string)?.trim();
    const legalName = (formData.get("legalName") as string)?.trim();
    const dbaName = (formData.get("dbaName") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;
    const website = (formData.get("website") as string)?.trim() || null;
    const entityType = (formData.get("entityType") as string) || "company";

    if (!name || name.length < 2) {
        return { error: "Display name is required (min 2 characters)" };
    }
    if (!legalName || legalName.length < 2) {
        return { error: "Legal name is required (min 2 characters)" };
    }
    if (entityType !== "individual" && entityType !== "company") {
        return { error: "Invalid entity type" };
    }

    // Уникальный slug
    let baseSlug = slugify(name);
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
                name,
                legalName,
                dbaName,
                slug,
                description,
                phone,
                email,
                website,
                entityType: entityType as "individual" | "company",
                status: false,
                moderationStatus: "pending",
            })
            .returning({ id: companies.id });

        createdId = created.id;
    } catch (err) {
        console.error("createCompany error:", err);
        return { error: "Failed to create company" };
    }

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
export async function updateCompany(
    _prevState: CompanyFormState,
    formData: FormData
): Promise<CompanyFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const id = Number(formData.get("id"));
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

    const name = (formData.get("name") as string)?.trim();
    const legalName = (formData.get("legalName") as string)?.trim();
    const dbaName = (formData.get("dbaName") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;
    const website = (formData.get("website") as string)?.trim() || null;
    const entityType = (formData.get("entityType") as string) || "company";
    const image = (formData.get("image") as string)?.trim() || null;

    const mainCategoryId = formData.get("mainCategoryId")
        ? Number(formData.get("mainCategoryId"))
        : null;
    const extraCategoryId1 = formData.get("extraCategoryId1")
        ? Number(formData.get("extraCategoryId1"))
        : null;
    const extraCategoryId2 = formData.get("extraCategoryId2")
        ? Number(formData.get("extraCategoryId2"))
        : null;

    if (!name || name.length < 2) {
        return { error: "Display name is required (min 2 characters)" };
    }
    if (!legalName || legalName.length < 2) {
        return { error: "Legal name is required (min 2 characters)" };
    }

    if (entityType !== "individual" && entityType !== "company") {
        return { error: "Invalid entity type" };
    }

    // Slug: если пользователь изменил name — можно оставить старый slug
    // (пока не даём менять slug вручную, чтобы не ломать ссылки)

    try {
        await db
            .update(companies)
            .set({
                name,
                legalName,
                dbaName,
                description,
                phone,
                email,
                website,
                entityType: entityType as "individual" | "company",
                image,
                updatedAt: new Date(),
                // moderationStatus и status provider менять не может
            })
            .where(
                and(
                    eq(companies.id, id),
                    eq(companies.userId, session.user.id)
                )
            );

// --- Categories ---
        const leafIds = [mainCategoryId, extraCategoryId1, extraCategoryId2].filter(
            (id): id is number => typeof id === "number" && !Number.isNaN(id) && id > 0
        );

// уникальные
        const uniqueLeafIds = [...new Set(leafIds)];

        if (uniqueLeafIds.length > 3) {
            return { error: "Maximum 3 categories" };
        }

// Подтягиваем pathIds для листьев
        const { getLeafOptions } = await import("@/lib/provider-categories");
        const allLeaves = await getLeafOptions();
        const leafMap = new Map(allLeaves.map((l) => [l.id, l]));

        for (const lid of uniqueLeafIds) {
            if (!leafMap.has(lid)) {
                return { error: "Invalid category selected" };
            }
        }

// Все должны быть из одной ветки
        if (uniqueLeafIds.length > 0) {
            const roots = new Set(
                uniqueLeafIds.map((id) => leafMap.get(id)!.rootId)
            );
            if (roots.size > 1) {
                return { error: "Categories must be from the same branch" };
            }
        }

// Собираем все categoryId для записи (листья + предки)
        const toLink = new Set<number>();
        for (const lid of uniqueLeafIds) {
            for (const pid of leafMap.get(lid)!.pathIds) {
                toLink.add(pid);
            }
        }

// Перезаписываем связи
        await db
            .delete(companyToCategory)
            .where(eq(companyToCategory.companyId, id));

        if (toLink.size > 0) {
            const mainLeaf =
                mainCategoryId && leafMap.has(mainCategoryId)
                    ? mainCategoryId
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
        revalidatePath(`/company/${existing.slug}`); // публичная страница

        return { success: true };
    } catch (err) {
        console.error("updateCompany error:", err);
        return { error: "Failed to update company" };
    }
}

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
export async function addCompanyImage(
    companyId: number,
    imageUrl: string
): Promise<GalleryState> {
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
export async function deleteCompanyImage(
    companyId: number,
    imageId: number
): Promise<GalleryState> {
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