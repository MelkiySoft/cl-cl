"use client";

import { useMemo } from "react";
import type { LeafOption } from "@/lib/provider-categories";

type Props = {
    leaves: LeafOption[];
    selectedIds: number[];
    mainCategoryId: number | null;
    onChange: (selectedIds: number[], mainCategoryId: number | null) => void;
    disabled?: boolean;
};

type TreeNode = {
    id: number;
    name: string;
    isLeaf: boolean;
    children: TreeNode[];
};

function nextMainId(
    selectedIds: number[],
    currentMain: number | null
): number | null {
    if (currentMain != null && selectedIds.includes(currentMain)) {
        return currentMain;
    }
    return selectedIds[0] ?? null;
}

function collectLeafIds(node: TreeNode): number[] {
    if (node.isLeaf) return [node.id];
    return node.children.flatMap(collectLeafIds);
}

function buildTree(leaves: LeafOption[]): TreeNode[] {
    type MutableNode = TreeNode & { childMap: Map<number, MutableNode> };

    const roots: MutableNode[] = [];
    const nodes = new Map<number, MutableNode>();

    function nodeName(leaf: LeafOption, index: number, isLeaf: boolean) {
        if (isLeaf) return leaf.name;
        return leaf.label.split(" › ")[index] ?? leaf.name;
    }

    for (const leaf of leaves) {
        const path = leaf.pathIds.length > 0 ? leaf.pathIds : [leaf.id];
        let parent: MutableNode | null = null;

        path.forEach((id, index) => {
            const isLeaf = index === path.length - 1;
            let node = parent ? parent.childMap.get(id) : nodes.get(id);

            if (!node) {
                node = {
                    id,
                    name: nodeName(leaf, index, isLeaf),
                    isLeaf,
                    children: [],
                    childMap: new Map(),
                };
                nodes.set(id, node);
                if (parent) {
                    parent.childMap.set(id, node);
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            } else if (isLeaf) {
                node.isLeaf = true;
            }

            parent = node;
        });
    }

    return roots;
}

function CheckStateIcon({
                            checked,
                            indeterminate,
                        }: {
    checked: boolean;
    indeterminate: boolean;
}) {
    return (
        <span
            aria-hidden
            className={[
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                checked || indeterminate
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background",
            ].join(" ")}
        >
            {checked ? (
                <svg viewBox="0 0 16 16" className="size-3" fill="none">
                    <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : indeterminate ? (
                <span className="block h-0.5 w-2 rounded-full bg-current" />
            ) : null}
        </span>
    );
}

export function CompanyAdminCategoriesFields({
                                                 leaves,
                                                 selectedIds,
                                                 mainCategoryId,
                                                 onChange,
                                                 disabled,
                                             }: Props) {
    const tree = useMemo(() => buildTree(leaves), [leaves]);
    const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
    const selectedLeaves = useMemo(
        () => leaves.filter((leaf) => selected.has(leaf.id)),
        [leaves, selected]
    );

    function setSelected(nextIds: number[], nextMain = mainCategoryId) {
        const unique = [...new Set(nextIds)];
        onChange(unique, nextMainId(unique, nextMain));
    }

    function toggleLeaf(id: number) {
        if (selected.has(id)) {
            setSelected(selectedIds.filter((leafId) => leafId !== id));
            return;
        }
        setSelected([...selectedIds, id], mainCategoryId ?? id);
    }

    function toggleNode(node: TreeNode) {
        const ids = collectLeafIds(node);
        if (ids.length === 0) return;

        const allOn = ids.every((id) => selected.has(id));
        if (allOn) {
            const remove = new Set(ids);
            setSelected(selectedIds.filter((id) => !remove.has(id)));
            return;
        }
        setSelected([...selectedIds, ...ids], mainCategoryId ?? ids[0]);
    }

    function selectAll() {
        setSelected(leaves.map((leaf) => leaf.id));
    }

    function clearAll() {
        setSelected([]);
    }

    function renderNode(node: TreeNode, depth: number) {
        const leafIds = collectLeafIds(node);
        const selectedCount = leafIds.filter((id) => selected.has(id)).length;
        const checked = leafIds.length > 0 && selectedCount === leafIds.length;
        const indeterminate = selectedCount > 0 && !checked;
        const isMain = node.isLeaf && node.id === mainCategoryId && checked;

        return (
            <li key={node.id}>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                        node.isLeaf && node.children.length === 0
                            ? toggleLeaf(node.id)
                            : toggleNode(node)
                    }
                    className="flex w-full items-start gap-2 rounded-sm px-1 py-0.5 text-left text-sm hover:bg-muted/60 disabled:opacity-50"
                    style={{ paddingLeft: 4 + depth * 16 }}
                >
                    <CheckStateIcon
                        checked={checked}
                        indeterminate={indeterminate}
                    />
                    <span className={node.children.length > 0 ? "font-medium" : undefined}>
                        {node.name}
                        {isMain ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                main
                            </span>
                        ) : null}
                    </span>
                </button>
                {node.children.length > 0 ? (
                    <ul className="border-l border-border/70 ml-3">
                        {node.children.map((child) => renderNode(child, depth + 1))}
                    </ul>
                ) : null}
            </li>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={selectAll}
                    disabled={disabled || leaves.length === 0}
                    className="text-sm underline underline-offset-4 disabled:opacity-50"
                >
                    Select all
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                    type="button"
                    onClick={clearAll}
                    disabled={disabled || selectedIds.length === 0}
                    className="text-sm underline underline-offset-4 disabled:opacity-50"
                >
                    Clear
                </button>
                <span className="text-xs text-muted-foreground">
                    {selectedIds.length} selected
                </span>
            </div>

            <div className="space-y-1">
                <label htmlFor="adminMainCategoryId" className="text-sm font-medium">
                    Main category
                </label>
                <select
                    id="adminMainCategoryId"
                    value={mainCategoryId ?? ""}
                    onChange={(event) => {
                        const value =
                            event.target.value === ""
                                ? null
                                : Number(event.target.value);
                        if (value != null && !selected.has(value)) {
                            setSelected([...selectedIds, value], value);
                            return;
                        }
                        onChange(selectedIds, value);
                    }}
                    disabled={disabled || selectedLeaves.length === 0}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                    <option value="">
                        {selectedLeaves.length === 0
                            ? "— Select categories first —"
                            : "— Select —"}
                    </option>
                    {selectedLeaves.map((leaf) => (
                        <option key={leaf.id} value={leaf.id}>
                            {leaf.label}
                        </option>
                    ))}
                </select>
            </div>

            <ul className="max-h-[28rem] overflow-auto rounded-md border border-input py-1">
                {tree.map((node) => renderNode(node, 0))}
            </ul>
        </div>
    );
}
