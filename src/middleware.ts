import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware now only handles API authentication
// Client-side routes use the AuthContext for auth state

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect API routes that aren't auth routes
    // Client-side route protection is handled by the pages themselves
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
        // For API routes, check Authorization header
        const authHeader = request.headers.get("Authorization");

        // We don't block API routes - let the route handlers do auth checks
        // This middleware just passes through
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
