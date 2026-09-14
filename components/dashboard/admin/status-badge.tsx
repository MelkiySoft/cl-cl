export function CompanyStatusBadge({
    moderationStatus,
    status,
}: {
    moderationStatus: string;
    status: boolean;
}) {
    if (moderationStatus === "approved" && status) {
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Live
            </span>
        );
    }
    if (moderationStatus === "approved") {
        return (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Approved (hidden)
            </span>
        );
    }
    if (moderationStatus === "rejected") {
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending review
        </span>
    );
}

export function RoleBadge({ role }: { role: string }) {
    const styles =
        role === "admin"
            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
            : role === "provider"
              ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>
            {role}
        </span>
    );
}

export function SourceBadge({ source }: { source: string }) {
    return (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
            {source}
        </span>
    );
}
