"use client";

import type { CompanyFormInput } from "@/lib/validations/company";
import type {
    FieldErrors,
    UseFormRegister,
    UseFormSetValue,
    UseFormWatch,
} from "react-hook-form";
import { WEEKDAYS } from "@/lib/company-hours";

type Props = {
    register: UseFormRegister<CompanyFormInput>;
    watch: UseFormWatch<CompanyFormInput>;
    setValue: UseFormSetValue<CompanyFormInput>;
    errors: FieldErrors<CompanyFormInput>;
    disabled?: boolean;
};

export function CompanyHoursFields({
    register,
    watch,
    setValue,
    errors,
    disabled,
}: Props) {
    const mode = watch("hoursMode");
    const hours = watch("hours");

    function copyWeekdays() {
        const monday = hours.find((h) => h.weekday === 1);
        if (!monday) return;
        const next = hours.map((h) =>
            h.weekday >= 1 && h.weekday <= 5
                ? {
                      ...h,
                      isClosed: monday.isClosed,
                      openTime: monday.openTime,
                      closeTime: monday.closeTime,
                  }
                : h
        );
        setValue("hours", next, { shouldDirty: true });
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="hoursMode" className="text-sm font-medium">
                        Hours
                    </label>
                    <select
                        id="hoursMode"
                        {...register("hoursMode")}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={disabled}
                    >
                        <option value="weekly">Weekly schedule</option>
                        <option value="always_open">Open 24/7</option>
                        <option value="by_appointment">By appointment</option>
                    </select>
                </div>
            </div>

            {mode === "weekly" && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={copyWeekdays}
                            disabled={disabled}
                        >
                            Copy Monday to weekdays
                        </button>
                    </div>

                    <div className="space-y-2">
                        {WEEKDAYS.map((day) => {
                            const index = hours.findIndex(
                                (h) => h.weekday === day.value
                            );
                            if (index < 0) return null;
                            const closed = hours[index]?.isClosed;
                            const dayError = errors.hours?.[index]?.openTime;

                            return (
                                <div
                                    key={day.value}
                                    className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[7.5rem_auto_1fr_1fr]"
                                >
                                    <span className="text-sm font-medium">
                                        {day.label}
                                    </span>
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={closed}
                                            onChange={(e) =>
                                                setValue(
                                                    `hours.${index}.isClosed`,
                                                    e.target.checked,
                                                    { shouldDirty: true }
                                                )
                                            }
                                            disabled={disabled}
                                        />
                                        Closed
                                    </label>
                                    <input
                                        type="time"
                                        {...register(`hours.${index}.openTime`)}
                                        disabled={disabled || closed}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                    />
                                    <input
                                        type="time"
                                        {...register(`hours.${index}.closeTime`)}
                                        disabled={disabled || closed}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                    />
                                    {dayError && (
                                        <p className="text-sm text-destructive sm:col-span-4">
                                            {dayError.message}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="hoursNote" className="text-sm font-medium">
                    Hours note
                </label>
                <input
                    id="hoursNote"
                    {...register("hoursNote")}
                    placeholder="Closed on federal holidays"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={disabled}
                />
                {errors.hoursNote && (
                    <p className="text-sm text-destructive">
                        {errors.hoursNote.message}
                    </p>
                )}
            </div>
        </div>
    );
}
