"use client";

import { useMemo } from "react";
import type { LeafOption } from "@/lib/provider-categories";

type Props = {
    leaves: LeafOption[];
    mainCategoryId: number | null;
    extraCategoryId1: number | null;
    extraCategoryId2: number | null;
    onMainChange: (id: number | null) => void;
    onExtra1Change: (id: number | null) => void;
    onExtra2Change: (id: number | null) => void;
    disabled?: boolean;
};

export function CompanyCategoriesFields({
                                            leaves,
                                            mainCategoryId,
                                            extraCategoryId1,
                                            extraCategoryId2,
                                            onMainChange,
                                            onExtra1Change,
                                            onExtra2Change,
                                            disabled,
                                        }: Props) {
    const mainLeaf = useMemo(
        () =>
            mainCategoryId == null
                ? null
                : (leaves.find((l) => l.id === mainCategoryId) ?? null),
        [mainCategoryId, leaves]
    );

    const extraOptions = useMemo(() => {
        if (!mainLeaf) return [];
        return leaves.filter(
            (l) => l.rootId === mainLeaf.rootId && l.id !== mainLeaf.id
        );
    }, [mainLeaf, leaves]);

    const extra1Options = extraOptions.filter((l) => l.id !== extraCategoryId2);
    const extra2Options = extraOptions.filter((l) => l.id !== extraCategoryId1);

    const parentsLabel = mainLeaf
        ? mainLeaf.label.split(" › ").slice(0, -1).join(" › ")
        : null;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="mainCategoryId" className="text-sm font-medium">
                    Main category
                </label>
                <select
                    id="mainCategoryId"
                    value={mainCategoryId ?? ""}
                    onChange={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value);
                        onMainChange(value);
                        // при смене основной категории сбрасываем дополнительные
                        onExtra1Change(null);
                        onExtra2Change(null);
                    }}
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

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="extraCategoryId1" className="text-sm font-medium">
                        Additional category
                    </label>
                    <select
                        id="extraCategoryId1"
                        value={extraCategoryId1 ?? ""}
                        onChange={(e) =>
                            onExtra1Change(
                                e.target.value === "" ? null : Number(e.target.value)
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
                    <label htmlFor="extraCategoryId2" className="text-sm font-medium">
                        Additional category
                    </label>
                    <select
                        id="extraCategoryId2"
                        value={extraCategoryId2 ?? ""}
                        onChange={(e) =>
                            onExtra2Change(
                                e.target.value === "" ? null : Number(e.target.value)
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