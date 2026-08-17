"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { createCompany } from "@/actions/provider-company";
import {
    companyCreateSchema,
    type CompanyCreateValues,
} from "@/lib/validations/company";

export function CreateCompanyForm() {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CompanyCreateValues>({
        resolver: zodResolver(companyCreateSchema),
        defaultValues: {
            name: "",
            legalName: "",
            dbaName: "",
            entityType: "company",
            ein: "",
            description: "",
            phone: "",
            email: "",
            website: "",
        },
    });

    function onSubmit(values: CompanyCreateValues) {
        setServerError(null);

        startTransition(async () => {
            const result = await createCompany(values);

            if (result?.error) {
                setServerError(result.error);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic information</CardTitle>
                    <CardDescription>
                        Name and business identity shown in the catalog
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Display name <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="name"
                                {...register("name")}
                                placeholder="Sparkle Clean Co"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                Shown in the catalog
                            </p>
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="legalName" className="text-sm font-medium">
                                Legal name <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="legalName"
                                {...register("legalName")}
                                placeholder="Sparkle Clean Co LLC"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                Official registered name
                            </p>
                            {errors.legalName && (
                                <p className="text-sm text-destructive">
                                    {errors.legalName.message}
                                </p>
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
                            <p className="text-sm text-destructive">
                                {errors.dbaName.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
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
                                <p className="text-sm text-destructive">
                                    {errors.entityType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="ein" className="text-sm font-medium">
                                EIN (Employer Identification Number)
                            </label>
                            <input
                                id="ein"
                                {...register("ein")}
                                placeholder="XX-XXXXXXX"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                Recommended for companies. Format: XX-XXXXXXX
                            </p>
                            {errors.ein && (
                                <p className="text-sm text-destructive">
                                    {errors.ein.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            id="description"
                            {...register("description")}
                            rows={4}
                            placeholder="Short description of your services..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            disabled={isPending}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description.message}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
                <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>
                        How customers can reach you
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                <p className="text-sm text-destructive">
                                    {errors.phone.message}
                                </p>
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
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
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
                            <p className="text-sm text-destructive">
                                {errors.website.message}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    {serverError && (
                        <p className="text-sm text-destructive">{serverError}</p>
                    )}
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create company"
                    )}
                </Button>
            </div>
        </form>
    );
}