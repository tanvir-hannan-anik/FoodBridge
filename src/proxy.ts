import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/auth/roles";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

/*
 * Fast, optimistic route protection based on the signed session cookie.
 * Pages and actions still re-check the user in the database (see lib/auth/dal.ts).
 */

const ROLE_AREAS = Object.entries(ROLE_HOME) as [keyof typeof ROLE_HOME, string][];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return session ? NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url)) : NextResponse.next();
  }

  const area = ROLE_AREAS.find(([, home]) => pathname === home || pathname.startsWith(`${home}/`));
  const needsLogin = area !== undefined || pathname === "/profile" || pathname === "/assistant";

  if (needsLogin && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  // Signed in, but trying to open another role's portal.
  if (area && session && area[0] !== session.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register/:path*", "/profile", "/assistant", "/donor/:path*", "/ngo/:path*", "/volunteer/:path*", "/admin/:path*"],
};
