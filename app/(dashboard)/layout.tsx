import { logout } from "@/actions/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b bg-white dark:bg-zinc-900">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <span className="font-medium">Dashboard</span>

                    <form action={logout}>
                        <button
                            type="submit"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Выйти
                        </button>
                    </form>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}