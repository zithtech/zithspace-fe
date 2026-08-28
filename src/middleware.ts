import { NextRequest, NextResponse } from "next/server";
import { PRODUCT_HEADER, productFromHostname } from "@/lib/product";

/**
 * Next.js Edge Middleware — runs before every request server-side.
 *
 * Responsibility:
 *  1. Block unauthenticated users from accessing any protected route.
 *  2. Redirect to /login with ?redirect=<original-path> so users return
 *     to their destination after login.
 *
 * NOTE: Fine-grained permission checks (e.g. "can this user see /accounts")
 * are handled CLIENT-SIDE in page components via usePermission(), because
 * the full permission list is stored in browser memory after /auth/me.
 * The backend ALWAYS validates permissions on every API call regardless.
 */

const PUBLIC_PATHS = [
  "/login",
  "/onboard/",
  "/onboard",
  "/forgot-password",
  "/reset-password",
  "/public/",
  "/_next/",
  "/favicon.ico",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/tenants/resolve",
  "/api/tenants/check-subdomain",
  "/api/public/",
  "/api/pipeline/portal/",
  "/notification.mp3",
  "/smallLogo.png",
  "/sw.js",
];

// Client-portal paths use a completely separate auth identity (see
// `ClientPortalAuthContext`). The edge middleware shouldn't redirect them to
// the staff `/login`. Client-portal token storage is localStorage, which the
// edge can't see, so the client-side guard in `ClientPortalAuthContext` does
// the actual auth check.
const PORTAL_PUBLIC = ["/portal", "/candidate-portal"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

function isPortalPath(pathname: string): boolean {
  return PORTAL_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Continue the request, stamping the resolved product on the REQUEST headers so
 * the root layout can read it with headers() and hand it to ProductProvider.
 *
 * It has to be the request headers, not the response: resolving the product on
 * the client instead would paint the full Zukvo navigation for one frame on a
 * testiez.com load, showing a Testiez customer a brand they are not supposed to
 * know about. Public paths get the header too — the login screen is the first
 * thing a customer sees and it needs to be branded correctly.
 */
function nextWithProduct(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(PRODUCT_HEADER, productFromHostname(request.headers.get("host")));
  return NextResponse.next({ request: { headers } });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip all public/static paths
  if (isPublicPath(pathname)) {
    return nextWithProduct(request);
  }

  // Portal routes have their own client-side guard — never bounce them to
  // staff /login.
  if (isPortalPath(pathname)) {
    return nextWithProduct(request);
  }

  // Check for access token in localStorage is not possible in Edge middleware.
  // Instead, check the auth cookie that the backend sets on login/refresh.
  // The cookie name used by the backend for the access-token is not set;
  // it only sets an httpOnly refresh-token cookie.
  // Strategy: check for the presence of the refresh-token cookie as a proxy
  // for "user has ever logged in". The real validation happens when the
  // access token is used on the first API call (axios interceptor refreshes it).

  const refreshTokenCookie = request.cookies.get("refreshToken");

  const authMarkerCookie = request.cookies.get("zithmi_auth");

  const hasAuthCookie = !!refreshTokenCookie || !!authMarkerCookie;

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithProduct(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - static notification assets
     */
    "/((?!_next/static|_next/image|favicon.ico|notification\\.mp3|smallLogo\\.png|sw\\.js).*)",
  ],
};
