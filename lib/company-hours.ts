export const WEEKDAYS = [
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
    { value: 0, label: "Sunday", short: "Sun" },
] as const

export type HoursMode = "weekly" | "always_open" | "by_appointment"

export type CompanyHourSlot = {
    weekday: number
    openTime: string
    closeTime: string
    isClosed: boolean
    sortOrder: number
}

/** Postgres `time` → "HH:MM" */
export function formatTimeValue(value: string | null | undefined): string {
    if (!value) return ""
    return value.slice(0, 5)
}

export function formatTimeRange(
    openTime: string | null,
    closeTime: string | null
): string {
    const open = formatTimeValue(openTime)
    const close = formatTimeValue(closeTime)
    if (!open || !close) return ""
    return `${to12h(open)} – ${to12h(close)}`
}

function to12h(hhmm: string): string {
    const [hStr, mStr] = hhmm.split(":")
    const h = Number(hStr)
    const m = Number(mStr)
    if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
    const suffix = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return m === 0 ? `${hour}:00 ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`
}

export type HoursDisplayRow = {
    label: string
    value: string
}

/** Схлопывает одинаковые дни: Mon–Fri 8:00 AM – 6:00 PM */
export function groupHoursForDisplay(slots: CompanyHourSlot[]): HoursDisplayRow[] {
    const byDay = new Map<number, CompanyHourSlot[]>()
    for (const slot of slots) {
        const list = byDay.get(slot.weekday) ?? []
        list.push(slot)
        byDay.set(slot.weekday, list)
    }

    const dayValues: { weekday: number; label: string; short: string; value: string }[] =
        WEEKDAYS.map((day) => {
            const daySlots = (byDay.get(day.value) ?? []).sort(
                (a, b) => a.sortOrder - b.sortOrder
            )
            if (daySlots.length === 0) {
                return { weekday: day.value, label: day.label, short: day.short, value: "" }
            }
            if (daySlots.every((s) => s.isClosed)) {
                return {
                    weekday: day.value,
                    label: day.label,
                    short: day.short,
                    value: "Closed",
                }
            }
            const ranges = daySlots
                .filter((s) => !s.isClosed)
                .map((s) => formatTimeRange(s.openTime, s.closeTime))
                .filter(Boolean)
            return {
                weekday: day.value,
                label: day.label,
                short: day.short,
                value: ranges.join(", "),
            }
        })

    const rows: HoursDisplayRow[] = []
    let i = 0
    while (i < dayValues.length) {
        const current = dayValues[i]
        if (!current.value) {
            i += 1
            continue
        }
        let j = i
        while (
            j + 1 < dayValues.length &&
            dayValues[j + 1].value === current.value
        ) {
            j += 1
        }
        const label =
            i === j
                ? current.label
                : `${dayValues[i].short}–${dayValues[j].short}`
        rows.push({ label, value: current.value })
        i = j + 1
    }
    return rows
}

export function emptyWeeklyHours(): CompanyHourSlot[] {
    return WEEKDAYS.map((day) => {
        const weekdayOpen = day.value >= 1 && day.value <= 5
        return {
            weekday: day.value,
            openTime: weekdayOpen ? "08:00" : "",
            closeTime: weekdayOpen ? "18:00" : "",
            isClosed: !weekdayOpen,
            sortOrder: 0,
        }
    })
}
