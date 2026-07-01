import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname === "/login";
  const isChangePasswordRoute = request.nextUrl.pathname === "/change-password";

  if (!user && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (user && !isLoginRoute && !isChangePasswordRoute) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("must_change_password, role")
      .eq("id", user.id)
      .maybeSingle();

    const mustChangePassword =
      profile?.must_change_password || user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      const passwordUrl = request.nextUrl.clone();
      passwordUrl.pathname = "/change-password";
      passwordUrl.search = "";
      return NextResponse.redirect(passwordUrl);
    }

    const isEditorAllowedRoute =
      request.nextUrl.pathname.startsWith("/cms") ||
      request.nextUrl.pathname === "/influencers" ||
      request.nextUrl.pathname === "/media";

    const role = profile?.role || user.user_metadata?.role;

    if (role === "editor" && !isEditorAllowedRoute) {
      const cmsUrl = request.nextUrl.clone();
      cmsUrl.pathname = "/cms/pages";
      cmsUrl.search = "";
      return NextResponse.redirect(cmsUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|fonts).*)"]
};
