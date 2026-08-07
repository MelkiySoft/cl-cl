"use client";

import { useMemo, useState, useEffect } from "react";
import type { LeafOption } from "@/lib/provider-categories";

type Props = {
    leaves: LeafOption[];
    initialMainId: number | null;
    initialExtraIds: number[];
    disabled?: boolean;
};

export function CompanyCategoriesFields({
                                            leaves,
                                            initialMainId,
                                            initialExtraIds,
                                            disabled,
                                        }: Props) {
    const [mainId, setMainId] = useState<number | "">(
        initialMainId ?? ""
    );
    const [extra1, setExtra1] = useState<number | "">(
        initialExtraIds[0] ?? ""
    );
    const [extra2, setExtra2] = useState<number | "">(
        initialExtraIds[1] ?? ""
    );

    const mainLeaf = useMemo(
        () => (mainId === "" ? null : leaves.find((l) => l.id === mainId) ?? null),
        [mainId, leaves]
    );

    const extraOptions = useMemo(() => {
        if (!mainLeaf) return [];
        return leaves.filter(
            (l) =>
                l.rootId === mainLeaf.rootId &&
                l.id !== mainLeaf.id
        );
    }, [mainLeaf, leaves]);

    const extra1Options = extraOptions.filter((l) => l.id !== extra2);
    const extra2Options = extraOptions.filter((l) => l.id !== extra1);

    function onMainChange(value: string) {
        const next = value === "" ? "" : Number(value);
        setMainId(next);
        setExtra1("");
        setExtra2("");
    }

    const autoParents =
        mainLeaf && mainLeaf.pathIds.length > 1
            ? mainLeaf.pathIds
                .slice(0, -1)
                .map((id) => leaves.find((l) => l.pathIds.includes(id)))
            : [];

    // Для подписи предков лучше взять label main без последнего сегмента
    const parentsLabel = mainLeaf
        ? mainLeaf.label.split(" › ").slice(0, -1).join(" › ")
        : null;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium">Categories</h3>
                <p className="text-xs text-muted-foreground">
                    Choose one main specialization and up to two related
                    categories from the same branch.
                </p>
            </div>

            {/* Main */}
            <div className="space-y-2">
                <label htmlFor="mainCategoryId" className="text-sm font-medium">
                    Main category
                </label>
                <select
                    id="mainCategoryId"
                    name="mainCategoryId"
                    value={mainId === "" ? "" : String(mainId)}
                    onChange={(e) => onMainChange(e.target.value)}
                    disabled={disabled}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">— Select —</option>
                    {leaves.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Extra 1 & 2 */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label
                        htmlFor="extraCategoryId1"
                        className="text-sm font-medium"
                    >
                        Additional category
                    </label>
                    <select
                        id="extraCategoryId1"
                        name="extraCategoryId1"
                        value={extra1 === "" ? "" : String(extra1)}
                        onChange={(e) =>
                            setExtra1(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        disabled={disabled || !mainLeaf}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                        <option value="">— None —</option>
                        {extra1Options.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="extraCategoryId2"
                        className="text-sm font-medium"
                    >
                        Additional category
                    </label>
                    <select
                        id="extraCategoryId2"
                        name="extraCategoryId2"
                        value={extra2 === "" ? "" : String(extra2)}
                        onChange={(e) =>
                            setExtra2(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        disabled={disabled || !mainLeaf}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                        <option value="">— None —</option>
                        {extra2Options.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {parentsLabel && (
                <p className="text-xs text-muted-foreground">
                    Also included automatically:{" "}
                    <span className="text-foreground/80">{parentsLabel}</span>
                </p>
            )}
        </div>
    );
}
