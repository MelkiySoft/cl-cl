import { BadgeCheck, MapPin, Search, ShieldCheck } from "lucide-react"

const ITEMS = [
    {
        icon: ShieldCheck,
        title: "Verified companies",
        text: "Every listing is checked before it goes live in the catalog.",
    },
    {
        icon: MapPin,
        title: "Local by ZIP",
        text: "Search by city or ZIP and see who actually works in your area.",
    },
    {
        icon: BadgeCheck,
        title: "Licensed & insured",
        text: "Filter teams that are licensed, bonded and insured.",
    },
    {
        icon: Search,
        title: "Compare before you call",
        text: "Read profiles, hours and photos — then contact the right fit.",
    },
] as const

export function WhyChoose() {
    return (
        <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">
                Why Choose Clean Closer
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ITEMS.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-xl border border-[#d3d8dc] p-5"
                    >
                        <item.icon
                            className="size-6 text-primary"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        <h3 className="mt-4 text-lg font-semibold text-foreground">
                            {item.title}
                        </h3>
                        <p className="mt-1.5 text-base text-muted-foreground">
                            {item.text}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    )
}
