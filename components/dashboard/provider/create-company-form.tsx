"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    createCompany,
    type CompanyFormState,
} from "@/actions/provider-company";

export function CreateCompanyForm() {
    const [state, formAction, isPending] = useActionState<
        CompanyFormState,
        FormData
    >(createCompany, {});

    return (
        <form action={formAction} className="space-y-8">
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
                        placeholder="Sparkle Clean Co"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                        Shown in the catalog
                    </p>
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
                        placeholder="Sparkle Clean Co LLC"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                        Official registered name
                    </p>
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
                    defaultValue="company"
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
                    placeholder="Residential and commercial cleaning in the greater Austin area..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

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
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}

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
        </form>
    );
}