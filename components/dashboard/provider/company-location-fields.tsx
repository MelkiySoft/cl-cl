"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import type { UseFormReturn } from "react-hook-form";
import { MapPin, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
    CompanyFormInput,
    CompanyFormValues,
} from "@/lib/validations/company";

type CitySuggestion = {
    city: string;
    stateId: string;
    label: string;
};

type ZipSuggestion = {
    zip: string;
    city: string;
    stateId: string;
    label: string;
};

type Props = {
    form: UseFormReturn<CompanyFormInput, unknown, CompanyFormValues>;
    disabled?: boolean;
};

const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const noBrowserAddress = {
    autoComplete: "disabled",
    autoCorrect: "off",
    autoCapitalize: "none",
    spellCheck: false,
    "data-1p-ignore": "true",
    "data-lpignore": "true",
    "data-form-type": "other",
} as const;

export function CompanyLocationFields({ form, disabled }: Props) {
    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = form;

    const sCity = watch("sCity") ?? "";
    const sZips = watch("sZips") ?? [];

    return (
        <>
            <Card className="overflow-visible">
                <CardHeader>
                    <CardTitle>Headquarters</CardTitle>
                    <CardDescription>
                        Office address in a listed city. City and state are filled from the ZIP.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="hqAddressLine1" className="text-sm font-medium">
                            Street address
                        </label>
                        <input
                            id="hqAddressLine1"
                            {...register("hqAddressLine1")}
                            {...noBrowserAddress}
                            placeholder="123 Main Street"
                            className={inputClass}
                            disabled={disabled}
                        />
                        {errors.hqAddressLine1 && (
                            <p className="text-sm text-destructive">
                                {errors.hqAddressLine1.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <HqZipField form={form} disabled={disabled} />
                        <div className="space-y-2">
                            <label htmlFor="hqCity" className="text-sm font-medium">
                                City
                            </label>
                            <input
                                id="hqCity"
                                {...register("hqCity")}
                                {...noBrowserAddress}
                                placeholder="From ZIP"
                                className={cn(inputClass, "bg-muted text-muted-foreground")}
                                readOnly
                                tabIndex={-1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="hqState" className="text-sm font-medium">
                                State
                            </label>
                            <input
                                id="hqState"
                                {...register("hqState")}
                                {...noBrowserAddress}
                                placeholder="From ZIP"
                                maxLength={2}
                                className={cn(inputClass, "bg-muted text-muted-foreground")}
                                readOnly
                                tabIndex={-1}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-visible">
                <CardHeader>
                    <CardTitle>Service area</CardTitle>
                    <CardDescription>
                        Choose one listed city and its ZIP codes. This is what the catalog uses.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ServiceCityField
                        value={sCity}
                        error={errors.sCity?.message}
                        disabled={disabled}
                        onChange={(label) => {
                            const next = label.trim()
                            const prev = String(sCity).trim()
                            setValue("sCity", label, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                            if (next !== prev) {
                                setValue("sZips", [], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        }}
                    />

                    <ServiceZipsField
                        sCity={sCity}
                        zips={Array.isArray(sZips) ? sZips : []}
                        error={errors.sZips?.message}
                        disabled={disabled}
                        onChange={(next) =>
                            setValue("sZips", next, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                    />

                    <div className="space-y-2">
                        <label htmlFor="sArea" className="text-sm font-medium">
                            Areas / neighborhoods
                        </label>
                        <textarea
                            id="sArea"
                            {...register("sArea")}
                            rows={3}
                            placeholder="Lincoln Park, Wicker Park, Near North Side"
                            className={inputClass}
                            disabled={disabled}
                        />
                        <p className="text-xs text-muted-foreground">
                            Free text. Shown on the company page, not used in filters.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

function menuStyleFromRect(rect: DOMRect): CSSProperties {
    return {
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240),
        zIndex: 80,
    };
}

function useSuggestMenu(open: boolean, onClose: () => void) {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

    function placeMenu() {
        const el = inputRef.current;
        if (!el) return;
        setMenuStyle(menuStyleFromRect(el.getBoundingClientRect()));
    }

    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            const target = event.target as Node;
            if (rootRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            onClose();
        }

        function onReposition() {
            const el = inputRef.current;
            if (!el) return;
            setMenuStyle(menuStyleFromRect(el.getBoundingClientRect()));
        }

        document.addEventListener("mousedown", onPointerDown);
        window.addEventListener("resize", onReposition);
        document.addEventListener("scroll", onReposition, true);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            window.removeEventListener("resize", onReposition);
            document.removeEventListener("scroll", onReposition, true);
        };
    }, [open, onClose]);

    return { rootRef, inputRef, menuRef, menuStyle, placeMenu };
}

function SuggestMenu({
    open,
    menuRef,
    style,
    children,
}: {
    open: boolean;
    menuRef: RefObject<HTMLDivElement | null>;
    style: CSSProperties;
    children: ReactNode;
}) {
    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={menuRef}
            style={style}
            className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
            {children}
        </div>,
        document.body
    );
}

function HqZipField({
    form,
    disabled,
}: {
    form: UseFormReturn<CompanyFormInput, unknown, CompanyFormValues>;
    disabled?: boolean;
}) {
    const {
        watch,
        setValue,
        formState: { errors },
    } = form;
    const value = String(watch("hqZip") ?? "");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<ZipSuggestion[]>([]);
    const { rootRef, inputRef, menuRef, menuStyle, placeMenu } =
        useSuggestMenu(open, () => setOpen(false));

    useEffect(() => {
        const q = value.trim();
        if (q.length < 2) return;

        const timer = window.setTimeout(() => {
            void fetch(`/api/geo/zips?q=${encodeURIComponent(q)}`)
                .then((res) => res.json())
                .then((data: { zips?: ZipSuggestion[] }) => {
                    setItems(data.zips ?? []);
                });
        }, 200);

        return () => window.clearTimeout(timer);
    }, [value]);

    const suggestions = value.trim().length < 2 ? [] : items;

    function pick(item: ZipSuggestion) {
        setValue("hqZip", item.zip, { shouldDirty: true, shouldValidate: true });
        setValue("hqCity", item.city, { shouldDirty: true });
        setValue("hqState", item.stateId, { shouldDirty: true });
        setOpen(false);
    }

    return (
        <div ref={rootRef} className="relative space-y-2">
            <label htmlFor="hqZip" className="text-sm font-medium">
                ZIP
            </label>
            <input
                id="hqZip"
                ref={inputRef}
                value={value}
                onChange={(e) => {
                    setValue("hqZip", e.target.value, { shouldDirty: true });
                    setValue("hqCity", "", { shouldDirty: true });
                    setValue("hqState", "", { shouldDirty: true });
                    placeMenu();
                    setOpen(true);
                }}
                onFocus={() => {
                    placeMenu();
                    setOpen(true);
                }}
                placeholder="60601"
                className={inputClass}
                disabled={disabled}
                {...noBrowserAddress}
            />
            {errors.hqZip && (
                <p className="text-sm text-destructive">{errors.hqZip.message}</p>
            )}
            <SuggestMenu
                open={open && suggestions.length > 0}
                menuRef={menuRef}
                style={menuStyle}
            >
                <div className="max-h-56 overflow-auto">
                    {suggestions.map((item) => (
                        <button
                            key={item.zip}
                            type="button"
                            onClick={() => pick(item)}
                            className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </SuggestMenu>
        </div>
    );
}

function ServiceCityField({
    value,
    error,
    disabled,
    onChange,
}: {
    value: string;
    error?: string;
    disabled?: boolean;
    onChange: (label: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<CitySuggestion[]>([]);
    const { rootRef, inputRef, menuRef, menuStyle, placeMenu } =
        useSuggestMenu(open, () => setOpen(false));

    useEffect(() => {
        const q = value.trim();
        const timer = window.setTimeout(() => {
            void fetch(`/api/geo/cities?q=${encodeURIComponent(q)}`)
                .then((res) => res.json())
                .then((data: { cities?: CitySuggestion[] }) => {
                    setItems(data.cities ?? []);
                });
        }, q.length >= 1 ? 200 : 0);

        return () => window.clearTimeout(timer);
    }, [value]);

    const suggestions = items;

    function pick(item: CitySuggestion) {
        onChange(item.label);
        setOpen(false);
    }

    return (
        <div ref={rootRef} className="relative space-y-2">
            <label htmlFor="sCity" className="text-sm font-medium">
                Service city <span className="text-destructive">*</span>
            </label>
            <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    id="sCity"
                    ref={inputRef}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        placeMenu();
                        setOpen(true);
                    }}
                    onFocus={() => {
                        placeMenu();
                        setOpen(true);
                    }}
                    placeholder="Chicago IL"
                    className={cn(inputClass, "pl-9")}
                    disabled={disabled}
                    {...noBrowserAddress}
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <SuggestMenu
                open={open && suggestions.length > 0}
                menuRef={menuRef}
                style={menuStyle}
            >
                <div className="max-h-56 overflow-auto">
                    {suggestions.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => pick(item)}
                            className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </SuggestMenu>
        </div>
    );
}

function ServiceZipsField({
    sCity,
    zips,
    error,
    disabled,
    onChange,
}: {
    sCity: string;
    zips: string[];
    error?: string;
    disabled?: boolean;
    onChange: (zips: string[]) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<ZipSuggestion[]>([]);
    const { rootRef, inputRef, menuRef, menuStyle, placeMenu } =
        useSuggestMenu(open, () => setOpen(false));

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2 && !sCity) return;

        const timer = window.setTimeout(() => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (sCity) params.set("sCity", sCity);
            void fetch(`/api/geo/zips?${params.toString()}`)
                .then((res) => res.json())
                .then((data: { zips?: ZipSuggestion[] }) => {
                    setItems(data.zips ?? []);
                });
        }, 200);

        return () => window.clearTimeout(timer);
    }, [query, sCity]);

    const suggestions = query.trim().length < 2 && !sCity ? [] : items;

    function addZip(zip: string) {
        const digits = zip.replace(/\D/g, "").slice(0, 5);
        if (digits.length !== 5) return;
        if (zips.includes(digits)) return;
        const belongsToCity = items.some((item) => item.zip === digits);
        if (!belongsToCity) return;
        onChange([...zips, digits]);
        setQuery("");
        setOpen(false);
    }

    function removeZip(zip: string) {
        onChange(zips.filter((item) => item !== zip));
    }

    return (
        <div ref={rootRef} className="relative space-y-2">
            <label htmlFor="sZips" className="text-sm font-medium">
                Service ZIPs <span className="text-destructive">*</span>
            </label>
            {zips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {zips.map((zip) => (
                        <span
                            key={zip}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                        >
                            {zip}
                            <button
                                type="button"
                                onClick={() => removeZip(zip)}
                                disabled={disabled}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Remove ${zip}`}
                            >
                                <X className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <input
                id="sZips"
                ref={inputRef}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    placeMenu();
                    setOpen(true);
                }}
                onFocus={() => {
                    placeMenu();
                    setOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        addZip(query);
                    }
                }}
                placeholder={sCity.trim() ? "Add a ZIP" : "Select a city first"}
                className={inputClass}
                disabled={disabled || !/^.+\s+[A-Za-z]{2}$/.test(sCity.trim())}
                {...noBrowserAddress}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <SuggestMenu
                open={open && suggestions.length > 0}
                menuRef={menuRef}
                style={menuStyle}
            >
                <div className="max-h-56 overflow-auto">
                    {suggestions.map((item) => (
                        <button
                            key={item.zip}
                            type="button"
                            onClick={() => addZip(item.zip)}
                            className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </SuggestMenu>
        </div>
    );
}
