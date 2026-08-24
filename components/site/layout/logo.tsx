import { AppLink } from "@/components/ui/app-link"

export function Logo() {
    return (
        <AppLink
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black">
        CL
      </span>
            <span className="hidden sm:inline-block">
        cl-<span className="text-primary">cl</span>
      </span>
        </AppLink>
    )
}