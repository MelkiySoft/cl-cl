import { eq, isNull, and, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, categoryPath, companyToCategory } from "@/db/schema";

export type LeafOption = {
    id: number;
    name: string;
    label: string; // Root › … › Leaf
    rootId: number;
    pathIds: number[]; // все предки + сам лист (для записи в company_to_category)
};

/** Все активные листовые категории с путём и rootId */
export async function getLeafOptions(): Promise<LeafOption[]> {
    const all = await db.query.categories.findMany({
        where: eq(categories.status, true),
        columns: {
            id: true,
            name: true,
            parentId: true,
            sortOrder: true,
        },
        orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
    });

    const childrenOf = new Set(
        all.filter((c) => c.parentId != null).map((c) => c.parentId as number)
    );
    const leaves = all.filter((c) => !childrenOf.has(c.id));

    if (leaves.length === 0) return [];

    const leafIds = leaves.map((c) => c.id);

    // path: categoryId → [{ pathId, level }, ...]
    const paths = await db.query.categoryPath.findMany({
        where: inArray(categoryPath.categoryId, leafIds),
    });

    const pathMap = new Map<number, { pathId: number; level: number }[]>();
    for (const p of paths) {
        const list = pathMap.get(p.categoryId) ?? [];
        list.push({ pathId: p.pathId, level: p.level });
        pathMap.set(p.categoryId, list);
    }

    const nameById = new Map(all.map((c) => [c.id, c.name]));

    const result: LeafOption[] = [];

    for (const leaf of leaves) {
        const pathEntries = (pathMap.get(leaf.id) ?? []).sort(
            (a, b) => a.level - b.level
        );

        // Если path пустой — только сам лист
        const pathIds =
            pathEntries.length > 0
                ? pathEntries.map((e) => e.pathId)
                : [leaf.id];

        // root = pathId с level 0, иначе сам лист
        const rootEntry = pathEntries.find((e) => e.level === 0);
        const rootId = rootEntry?.pathId ?? leaf.id;

        const label = pathIds
            .map((id) => nameById.get(id) ?? "?")
            .join(" › ");

        result.push({
            id: leaf.id,
            name: leaf.name,
            label,
            rootId,
            pathIds,
        });
    }

    // Сортировка по label
    result.sort((a, b) => a.label.localeCompare(b.label));
    return result;
}

/** Текущий выбор компании: main + extras (только листья) */
export async function getCompanyLeafSelection(companyId: number): Promise<{
    mainId: number | null;
    extraIds: number[];
}> {
    const links = await db.query.companyToCategory.findMany({
        where: eq(companyToCategory.companyId, companyId),
    });

    if (links.length === 0) {
        return { mainId: null, extraIds: [] };
    }

    const linkedIds = links.map((l) => l.categoryId);

    // Листья среди привязанных = те, у кого нет детей в linkedIds
    // Проще: все категории, у которых есть children в БД
    const allCats = await db.query.categories.findMany({
        where: inArray(categories.id, linkedIds),
        columns: { id: true, parentId: true },
    });

    const parentIdsInSelection = new Set(
        allCats.filter((c) => c.parentId != null).map((c) => c.parentId!)
    );

    // Лист в выборе = id, который не является parentId другого выбранного
    // Надёжнее: id, у которого нет ни одной дочерней категории в целом дереве,
    // И он в linkedIds. Используем childrenOf по всей таблице дорого,
    // поэтому: лист = категория, чей id не встречается как parentId среди all active
    const childParents = await db
        .selectDistinct({ parentId: categories.parentId })
        .from(categories)
        .where(
            and(
                eq(categories.status, true),
                sql`${categories.parentId} is not null`
            )
        );

    const hasChildren = new Set(
        childParents.map((r) => r.parentId).filter(Boolean) as number[]
    );

    const leafLinks = links.filter((l) => !hasChildren.has(l.categoryId));

    const mainLink = leafLinks.find((l) => l.isMain) ?? leafLinks[0];
    const mainId = mainLink?.categoryId ?? null;

    const extraIds = leafLinks
        .filter((l) => l.categoryId !== mainId)
        .map((l) => l.categoryId)
        .slice(0, 2);

    return { mainId, extraIds };
}