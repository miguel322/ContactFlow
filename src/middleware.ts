import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Bypass static files, api routes, and icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some(
    (route) => pathname.startsWith(route)
  );
  const isLandingRoute = pathname === "/";
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!user) {
    if (!isAuthRoute && !isLandingRoute && !isOnboardingRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // User is authenticated
  if (isAuthRoute || isLandingRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  let orgId = request.cookies.get("contactflow:org_id")?.value;

  if (!orgId && !isOnboardingRoute) {
    // Query organization from DB
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("profile_id", user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].organization_id;
      
      const response = NextResponse.redirect(request.nextUrl);
      response.cookies.set("contactflow:org_id", orgId as string, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    } else {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isOnboardingRoute) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("profile_id", user.id);

    if (memberships && memberships.length > 0) {
      const firstOrg = memberships[0].organization_id;
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      response.cookies.set("contactflow:org_id", firstOrg, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
