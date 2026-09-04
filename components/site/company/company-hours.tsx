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
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="size-4" />
                    Hours
                </h2>
                <p className="text-sm">Open 24/7</p>
                {note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{note}</p>
                ) : null}
            </section>
        )
    }

    if (mode === "by_appointment") {
        return (
            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="size-4" />
                    Hours
                </h2>
                <p className="text-sm">By appointment</p>
                {note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{note}</p>
                ) : null}
            </section>
        )
    }

    const rows = groupHoursForDisplay(hours)
    if (rows.length === 0 && !note) return null

    return (
        <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="size-4" />
                Hours
            </h2>
            {rows.length > 0 && (
                <dl className="space-y-1.5 text-sm">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between gap-4"
                        >
                            <dt className="text-muted-foreground">{row.label}</dt>
                            <dd className="font-medium">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {note ? (
                <p className="mt-2 text-sm text-muted-foreground">{note}</p>
            ) : null}
        </section>
    )
}
