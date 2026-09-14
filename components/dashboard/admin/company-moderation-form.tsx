"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { updateAdminCompanyModeration } from "@/actions/admin-companies";
import type { ModerationStatus } from "@/db/schema";

type Props = {
    companyId: number;
    status: boolean;
    moderationStatus: ModerationStatus;
    moderationNote: string | null;
};

export function CompanyModerationForm({
    companyId,
    status,
    moderationStatus,
    moderationNote,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [live, setLive] = useState(status);
    const [moderation, setModeration] = useState<ModerationStatus>(moderationStatus);
    const [note, setNote] = useState(moderationNote ?? "");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function onSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        startTransition(async () => {
            const result = await updateAdminCompanyModeration({
                companyId,
                status: live,
                moderationStatus: moderation,
                moderationNote: note,
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
                <CardTitle>Moderation</CardTitle>
                <CardDescription>
                    Visibility in catalog and review status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label htmlFor="moderationStatus" className="text-sm font-medium">
                                Review
                            </label>
                            <select
                                id="moderationStatus"
                                value={moderation}
                                onChange={(event) =>
                                    setModeration(event.target.value as ModerationStatus)
                                }
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="visibility" className="text-sm font-medium">
                                Catalog visibility
                            </label>
                            <select
                                id="visibility"
                                value={live ? "live" : "hidden"}
                                onChange={(event) => setLive(event.target.value === "live")}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="hidden">Hidden</option>
                                <option value="live">Live</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="moderationNote" className="text-sm font-medium">
                            Note
                        </label>
                        <textarea
                            id="moderationNote"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save moderation"}
                    </Button>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && (
                        <p className="text-sm text-green-700 dark:text-green-400">
                            Moderation updated
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
