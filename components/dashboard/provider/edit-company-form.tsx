"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateCompany } from "@/actions/provider-company";
import { createUploadUrl } from "@/actions/upload";
import { CompanyGallery } from "@/components/dashboard/provider/company-gallery";
import { CompanyCategoriesFields } from "@/components/dashboard/provider/company-categories-fields";
import type { LeafOption } from "@/lib/provider-categories";
import {
    companyFormSchema,
    type CompanyFormValues,
} from "@/lib/validations/company";

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
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            id: company.id,
            name: company.name,
            legalName: company.legalName,
            dbaName: company.dbaName ?? "",
            entityType: company.entityType as "company" | "individual",
            description: company.description ?? "",
            phone: company.phone ?? "",
            email: company.email ?? "",
            website: company.website ?? "",
            image: company.image ?? "",
            mainCategoryId: categorySelection.mainId,
            extraCategoryId1: categorySelection.extraIds[0] ?? null,
            extraCategoryId2: categorySelection.extraIds[1] ?? null,
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = form;

    const imageUrl = watch("image");

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

            setValue("image", result.publicUrl!, { shouldDirty: true });
        } catch {
            setUploadError("Failed to upload image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    function onSubmit(values: CompanyFormValues) {
        setServerError(null);
        setSuccess(false);

        startTransition(async () => {
            const result = await updateCompany(values);

            if (result.error) {
                setServerError(result.error);
                return;
            }

            setSuccess(true);
            reset(values);
            router.refresh();
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Status */}
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Moderation:{" "}
              <strong className="capitalize">{company.moderationStatus}</strong>
          </span>
                    <span>
            In catalog: <strong>{company.status ? "Yes" : "No"}</strong>
          </span>
                    <span className="text-muted-foreground">/{company.slug}</span>
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
                    <p className="text-xs text-muted-foreground">JPG, PNG or WebP</p>
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
                        {...register("name")}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="legalName" className="text-sm font-medium">
                        Legal name <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="legalName"
                        {...register("legalName")}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    {errors.legalName && (
                        <p className="text-sm text-destructive">{errors.legalName.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="dbaName" className="text-sm font-medium">
                    DBA name (Doing Business As)
                </label>
                <input
                    id="dbaName"
                    {...register("dbaName")}
                    placeholder="Optional"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
                {errors.dbaName && (
                    <p className="text-sm text-destructive">{errors.dbaName.message}</p>
                )}
            </div>

            {/* Entity type */}
            <div className="space-y-2">
                <label htmlFor="entityType" className="text-sm font-medium">
                    Entity type
                </label>
                <select
                    id="entityType"
                    {...register("entityType")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                >
                    <option value="company">Company</option>
                    <option value="individual">Individual</option>
                </select>
                {errors.entityType && (
                    <p className="text-sm text-destructive">{errors.entityType.message}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                    Description
                </label>
                <textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
            </div>

            {/* Categories */}
            <CompanyCategoriesFields
                leaves={leaves}
                mainCategoryId={watch("mainCategoryId")}
                extraCategoryId1={watch("extraCategoryId1")}
                extraCategoryId2={watch("extraCategoryId2")}
                onMainChange={(id) =>
                    setValue("mainCategoryId", id, { shouldDirty: true })
                }
                onExtra1Change={(id) =>
                    setValue("extraCategoryId1", id, { shouldDirty: true })
                }
                onExtra2Change={(id) =>
                    setValue("extraCategoryId2", id, { shouldDirty: true })
                }
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
                        type="tel"
                        {...register("phone")}
                        placeholder="+1 555 123 4567"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="info@example.com"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">
                    Website
                </label>
                <input
                    id="website"
                    type="url"
                    {...register("website")}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
                {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
            </div>

            {/* Messages */}
            {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
            )}
            {success && (
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