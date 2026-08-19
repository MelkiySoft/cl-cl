import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const role = req.auth?.user?.role
    const path = nextUrl.pathname

    // ===== Catalog rewrite =====
    // Чистые URL (/catalog, /catalog/xxx) остаются статическими.
    // Если есть page/sort/limit — переписываем на /catalog/filter/...
    if (path === "/catalog" || path.startsWith("/catalog/")) {
        // Уже filter — ничего не делаем
        if (!path.startsWith("/catalog/filter")) {
            const hasFilterParams =
                nextUrl.searchParams.has("page") ||
                nextUrl.searchParams.has("sort") ||
                nextUrl.searchParams.has("limit")

            if (hasFilterParams) {
                const newPath = path.replace(/^\/catalog/, "/catalog/filter")
                const url = new URL(newPath, nextUrl)
                url.search = nextUrl.search // сохраняем query
                return NextResponse.rewrite(url)
            }
        }
    }

    // ===== Auth pages =====
    if (path === "/login" || path === "/register") {
        if (isLoggedIn) {
            const dest =
                role === "admin"
                    ? "/admin"
                    : role === "provider"
                        ? "/provider"
                        : "/customer"
            return NextResponse.redirect(new URL(dest, nextUrl))
        }
        return NextResponse.next()
    }

    // ===== Role protection =====
    if (path.startsWith("/admin")) {
        if (!isLoggedIn || role !== "admin") {
            return NextResponse.redirect(new URL("/login", nextUrl))
        }
    }

    if (path.startsWith("/provider")) {
        if (!isLoggedIn || (role !== "provider" && role !== "admin")) {
            return NextResponse.redirect(new URL("/login", nextUrl))
        }
    }

    if (path.startsWith("/customer")) {
        if (!isLoggedIn || (role !== "customer" && role !== "admin")) {
            return NextResponse.redirect(new URL("/login", nextUrl))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
}