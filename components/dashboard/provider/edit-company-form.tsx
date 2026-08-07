"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    updateCompany,
    type CompanyFormState,
} from "@/actions/provider-company";
import { createUploadUrl } from "@/actions/upload";
import { CompanyGallery } from "@/components/dashboard/provider/company-gallery";
import type { LeafOption } from "@/lib/provider-categories";
import { CompanyCategoriesFields } from "@/components/dashboard/provider/company-categories-fields";

type Company = {
    id: number;
    name: string;
    legalName: string;
    dbaName: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    entityType: string;
    image: string | null;
    moderationStatus: string;
    status: boolean;
    slug: string;
};

type GalleryImage = {
    id: number;
    image: string;
    sortOrder: number;
};

type Props = {
    company: Company;
    images: GalleryImage[];
    leaves: LeafOption[];
    categorySelection: {
        mainId: number | null;
        extraIds: number[];
    };
};

export function EditCompanyForm({
                                    company,
                                    images,
                                    leaves,
                                    categorySelection,
                                }: Props) {
    const [state, formAction, isPending] = useActionState<
        CompanyFormState,
        FormData
    >(updateCompany, {});

    const [imageUrl, setImageUrl] = useState(company.image ?? "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Сбрасываем success-сообщение через несколько секунд можно позже

    const initials = company.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setUploading(true);

        try {
            const result = await createUploadUrl({
                filename: file.name,
                contentType: file.type,
                folder: "companies",
                entityId: company.id,
            });

            if ("error" in result && result.error) {
                setUploadError(result.error);
                return;
            }

            if (!("uploadUrl" in result) || !result.uploadUrl) {
                setUploadError("Failed to get upload URL");
                return;
            }

            const uploadRes = await fetch(result.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) {
                setUploadError("Upload failed");
                return;
            }

            setImageUrl(result.publicUrl!);
        } catch {
            setUploadError("Failed to upload image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <form action={formAction} className="space-y-8">
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="image" value={imageUrl} />

            {/* Status (read-only) */}
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                        Moderation:{" "}
                        <strong className="capitalize">
                            {company.moderationStatus}
                        </strong>
                    </span>
                    <span>
                        In catalog:{" "}
                        <strong>{company.status ? "Yes" : "No"}</strong>
                    </span>
                    <span className="text-muted-foreground">
                        /{company.slug}
                    </span>
                </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-6">
                <Avatar className="size-20 rounded-lg">
                    <AvatarImage
                        src={imageUrl || undefined}
                        alt={company.name}
                        className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading || isPending}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading || isPending}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 size-4" />
                                Change logo
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP
                    </p>
                    {uploadError && (
                        <p className="text-sm text-destructive">{uploadError}</p>
                    )}
                </div>
            </div>

            <CompanyGallery companyId={company.id} images={images} />

            {/* Names */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Display name <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={120}
                        defaultValue={company.name}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="legalName" className="text-sm font-medium">
                        Legal name <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="legalName"
                        name="legalName"
                        type="text"
                        required
                        minLength={2}
                        maxLength={160}
                        defaultValue={company.legalName}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="dbaName" className="text-sm font-medium">
                    DBA name (Doing Business As)
                </label>
                <input
                    id="dbaName"
                    name="dbaName"
                    type="text"
                    maxLength={160}
                    defaultValue={company.dbaName ?? ""}
                    placeholder="Optional"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

            {/* Entity type */}
            <div className="space-y-2">
                <label htmlFor="entityType" className="text-sm font-medium">
                    Entity type
                </label>
                <select
                    id="entityType"
                    name="entityType"
                    defaultValue={company.entityType}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                >
                    <option value="company">Company</option>
                    <option value="individual">Individual</option>
                </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={5}
                    maxLength={5000}
                    defaultValue={company.description ?? ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

            <CompanyCategoriesFields
                leaves={leaves}
                initialMainId={categorySelection.mainId}
                initialExtraIds={categorySelection.extraIds}
                disabled={isPending}
            />

            {/* Contacts */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                        Phone
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={company.phone ?? ""}
                        placeholder="+1 555 123 4567"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={company.email ?? ""}
                        placeholder="info@example.com"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">
                    Website
                </label>
                <input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={company.website ?? ""}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

            {/* Messages */}
            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                    Changes saved
                </p>
            )}

            <Button type="submit" disabled={isPending || uploading}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Save changes"
                )}
            </Button>
        </form>
    );
}