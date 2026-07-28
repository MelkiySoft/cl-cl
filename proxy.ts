import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const role = req.auth?.user?.role;
    const path = nextUrl.pathname;

    // Страницы авторизации
    if (path === "/login" || path === "/register") {
        if (isLoggedIn) {
            const dest =
                role === "admin"
                    ? "/admin"
                    : role === "provider"
                        ? "/provider"
                        : "/customer";
            return NextResponse.redirect(new URL(dest, nextUrl));
        }
        return NextResponse.next();
    }

    // Защита ролевых дашбордов
    if (path.startsWith("/admin")) {
        if (!isLoggedIn || role !== "admin") {
            return NextResponse.redirect(new URL("/login", nextUrl));
        }
    }

    if (path.startsWith("/provider")) {
        if (!isLoggedIn || (role !== "provider" && role !== "admin")) {
            return NextResponse.redirect(new URL("/login", nextUrl));
        }
    }

    if (path.startsWith("/customer")) {
        if (!isLoggedIn || (role !== "customer" && role !== "admin")) {
            return NextResponse.redirect(new URL("/login", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};