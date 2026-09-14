import { AppLink } from "@/components/ui/app-link";
import { getAdminOverview } from "@/actions/admin-companies";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default async function AdminPage() {
    const overview = await getAdminOverview();

    const cards = [
        {
            title: "Users",
            value: overview.users,
            href: "/admin/users",
            description: "Accounts in the system",
        },
        {
            title: "Companies",
            value: overview.companies,
            href: "/admin/companies",
            description: "All catalog records",
        },
        {
            title: "Unclaimed",
            value: overview.unclaimed,
            href: "/admin/companies?claimed=0",
            description: "Companies without an owner",
        },
        {
            title: "Pending review",
            value: overview.pending,
            href: "/admin/companies?moderation=pending",
            description: "Waiting for moderation",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                    Users, companies and moderation
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <AppLink key={card.href} href={card.href} className="block transition-opacity hover:opacity-90">
                        <Card>
                            <CardHeader>
                                <CardDescription>{card.title}</CardDescription>
                                <CardTitle className="text-3xl tabular-nums">
                                    {card.value}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    </AppLink>
                ))}
            </div>
        </div>
    );
}
