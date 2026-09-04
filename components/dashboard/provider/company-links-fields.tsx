"use client";

import type { CompanyFormInput } from "@/lib/validations/company";
import type {
    FieldErrors,
    UseFormRegister,
    UseFormSetValue,
    UseFormWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    COMPANY_LINK_LABELS,
    COMPANY_LINK_TYPES,
} from "@/lib/company-links";
import type { CompanyLinkType } from "@/db/schema";

type Props = {
    register: UseFormRegister<CompanyFormInput>;
    watch: UseFormWatch<CompanyFormInput>;
    setValue: UseFormSetValue<CompanyFormInput>;
    errors: FieldErrors<CompanyFormInput>;
    disabled?: boolean;
};

export function CompanyLinksFields({
    register,
    watch,
    setValue,
    errors,
    disabled,
}: Props) {
    const links = watch("links");
    const used = new Set(links.map((l) => l.type));

    function addLink() {
        const nextType =
            COMPANY_LINK_TYPES.find((t) => !used.has(t)) ?? "other";
        setValue(
            "links",
            [...links, { type: nextType, url: "" }],
            { shouldDirty: true }
        );
    }

    function removeLink(index: number) {
        setValue(
            "links",
            links.filter((_, i) => i !== index),
            { shouldDirty: true }
        );
    }

    return (
        <div className="space-y-3">
            {links.map((link, index) => (
                <div
                    key={`${link.type}-${index}`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[12rem_1fr_auto]"
                >
                    <select
                        {...register(`links.${index}.type`)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={disabled}
                    >
                        {COMPANY_LINK_TYPES.map((type) => (
                            <option
                                key={type}
                                value={type}
                                disabled={
                                    type !== link.type && used.has(type)
                                }
                            >
                                {COMPANY_LINK_LABELS[type as CompanyLinkType]}
                            </option>
                        ))}
                    </select>
                    <input
                        type="url"
                        {...register(`links.${index}.url`)}
                        placeholder="https://"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={disabled}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLink(index)}
                        disabled={disabled}
                    >
                        Remove
                    </Button>
                    {errors.links?.[index]?.type && (
                        <p className="text-sm text-destructive sm:col-span-3">
                            {errors.links[index]?.type?.message}
                        </p>
                    )}
                    {errors.links?.[index]?.url && (
                        <p className="text-sm text-destructive sm:col-span-3">
                            {errors.links[index]?.url?.message}
                        </p>
                    )}
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                disabled={disabled || used.size >= COMPANY_LINK_TYPES.length}
            >
                Add link
            </Button>
        </div>
    );
}
