import {
    groupHoursForDisplay,
    type CompanyHourSlot,
    type HoursMode,
} from "@/lib/company-hours"
import { Clock } from "lucide-react"

type Props = {
    mode: HoursMode
    hours: CompanyHourSlot[]
    note?: string | null
}

export function CompanyHours({ mode, hours, note }: Props) {
    if (mode === "always_open") {
        return (
            <section>
                <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3 flex items-center gap-2">
                    <Clock className="size-6" />
                    Hours
                </h2>
                <p className="text-lg font-bold">Open 24/7</p>
                {note ? (
                    <p className="mt-2 text-lg text-muted-foreground">{note}</p>
                ) : null}
            </section>
        )
    }

    if (mode === "by_appointment") {
        return (
            <section>
                <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3 flex items-center gap-2">
                    <Clock className="size-6" />
                    Hours
                </h2>
                <p className="text-lg font-bold">By appointment</p>
                {note ? (
                    <p className="mt-2 text-lg text-muted-foreground">{note}</p>
                ) : null}
            </section>
        )
    }

    const rows = groupHoursForDisplay(hours)
    if (rows.length === 0 && !note) return null

    return (
        <section>
            <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3 flex items-center gap-2">
                <Clock className="size-6" />
                Hours
            </h2>
            {rows.length > 0 && (
                <dl className="space-y-1.5 text-lg text-muted-foreground">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="grid grid-cols-[minmax(7rem,auto)_1fr] items-baseline gap-x-6"
                        >
                            <dt>{row.label}</dt>
                            <dd className="font-bold">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {note ? (
                <p className="mt-2 text-lg text-muted-foreground">{note}</p>
            ) : null}
        </section>
    )
}
