import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";



// Список разрешённых IP (через запятую в env)
const ALLOWED_IPS = "194.107.178.190666,192.168.0.1666"
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

function getClientIp(req: Request): string | null {
    const forwarded = req.headers.get("x-forwarded-for");
    console.log(forwarded);
    if (forwarded) {
        return forwarded.split(",")[0]?.trim() || null;
    }
    return req.headers.get("x-real-ip");
}




export const proxy = auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // === IP Restriction ===
    // В development проверку пропускаем, чтобы не мешала локальной работе
    if (process.env.NODE_ENV === "production" && ALLOWED_IPS.length > 0) {
        const clientIp = getClientIp(req);
        if (!clientIp || !ALLOWED_IPS.includes(clientIp)) {
            return new NextResponse(
                `Access denied. Your IP (${clientIp || "unknown"}) is not allowed.`,
                { status: 403 }
            );
        }
    }

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