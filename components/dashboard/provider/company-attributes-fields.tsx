"use client";

import type {
    FieldErrors,
    UseFormSetValue,
    UseFormWatch,
} from "react-hook-form";

import type { AttributeDefinition } from "@/lib/company-attributes";
import type { CompanyFormInput } from "@/lib/validations/company";

type Props = {
    definitions: AttributeDefinition[];
    watch: UseFormWatch<CompanyFormInput>;
    setValue: UseFormSetValue<CompanyFormInput>;
    errors: FieldErrors<CompanyFormInput>;
    disabled?: boolean;
};

export function CompanyAttributesFields({
                                            definitions,
                                            watch,
                                            setValue,
                                            errors,
                                            disabled,
                                        }: Props) {
    const attributes = watch("attributes") ?? [];

    function indexOf(attributeId: number) {
        return attributes.findIndex((item) => item.attributeId === attributeId);
    }

    return (
        <div className="space-y-6">
            {definitions.map((def) => {
                const index = indexOf(def.id);
                if (index < 0) return null;
                const current = attributes[index];
                const fieldError = errors.attributes?.[index];

                return (
                    <div key={def.id} className="space-y-2">
                        <p className="text-sm font-medium">{def.name}</p>

                        {def.type === "boolean" && (
                            <select
                                value={
                                    current.booleanValue === null
                                        ? ""
                                        : current.booleanValue
                                            ? "true"
                                            : "false"
                                }
                                disabled={disabled}
                                onChange={(event) => {
                                    const raw = event.target.value;
                                    const booleanValue =
                                        raw === "" ? null : raw === "true";
                                    setValue(
                                        `attributes.${index}.booleanValue`,
                                        booleanValue,
                                        { shouldDirty: true }
                                    );
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Not specified</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        )}

                        {def.type === "number" && (
                            <input
                                type="number"
                                inputMode="numeric"
                                value={current.numberValue ?? ""}
                                disabled={disabled}
                                onChange={(event) => {
                                    const raw = event.target.value;
                                    setValue(
                                        `attributes.${index}.numberValue`,
                                        raw === "" ? null : Number(raw),
                                        { shouldDirty: true }
                                    );
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        )}

                        {def.type === "select" && (
                            <select
                                value={current.valueIds[0] ?? ""}
                                disabled={disabled}
                                onChange={(event) => {
                                    const raw = event.target.value;
                                    setValue(
                                        `attributes.${index}.valueIds`,
                                        raw === "" ? [] : [Number(raw)],
                                        { shouldDirty: true }
                                    );
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Not specified</option>
                                {def.values.map((value) => (
                                    <option key={value.id} value={value.id}>
                                        {value.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {def.type === "multiselect" && (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {def.values.map((value) => {
                                    const checked = current.valueIds.includes(value.id);
                                    return (
                                        <label
                                            key={value.id}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={(event) => {
                                                    const next = event.target.checked
                                                        ? [...current.valueIds, value.id]
                                                        : current.valueIds.filter(
                                                            (id) => id !== value.id
                                                        );
                                                    setValue(
                                                        `attributes.${index}.valueIds`,
                                                        next,
                                                        { shouldDirty: true }
                                                    );
                                                }}
                                            />
                                            {value.name}
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {fieldError && (
                            <p className="text-sm text-destructive">
                                {"message" in fieldError
                                    ? String(fieldError.message ?? "")
                                    : "Invalid value"}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
