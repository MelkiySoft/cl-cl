"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    updateAdminCompanyOwner,
    type AdminProviderOption,
} from "@/actions/admin-companies";

type Props = {
    companyId: number;
    claimedAt: Date | null;
    owner: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    } | null;
    providers: AdminProviderOption[];
};

function formatDate(value: Date | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function CompanyOwnerForm({
    companyId,
    claimedAt,
    owner,
    providers,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [userId, setUserId] = useState(owner?.id ?? "");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function onSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        startTransition(async () => {
            const result = await updateAdminCompanyOwner({
                companyId,
                userId: userId || null,
            });

            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess(true);
            router.refresh();
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Owner</CardTitle>
                <CardDescription>
                    Assign a provider or leave the company unclaimed
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 text-sm">
                    {owner ? (
                        <p>
                            Current:{" "}
                            <AppLink
                                href={`/admin/users/${owner.id}`}
                                className="font-medium hover:underline"
                            >
                                {owner.name || owner.email}
                            </AppLink>
                            <span className="text-muted-foreground">
                                {" "}
                                · {owner.email}
                            </span>
                        </p>
                    ) : (
                        <p className="text-muted-foreground">Unclaimed — no user attached</p>
                    )}
                    <p className="mt-1 text-muted-foreground">
                        Claimed at: {formatDate(claimedAt)}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-1">
                        <label htmlFor="ownerId" className="text-sm font-medium">
                            Provider
                        </label>
                        <select
                            id="ownerId"
                            value={userId}
                            onChange={(event) => setUserId(event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Unclaimed</option>
                            {owner &&
                                owner.role !== "provider" &&
                                !providers.some((provider) => provider.id === owner.id) && (
                                    <option value={owner.id}>
                                        {owner.email} ({owner.role})
                                    </option>
                                )}
                            {providers.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name
                                        ? `${provider.name} · ${provider.email}`
                                        : provider.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save owner"}
                    </Button>
                </form>

                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                {success && (
                    <p className="mt-3 text-sm text-green-700 dark:text-green-400">
                        Owner updated
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
