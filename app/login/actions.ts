"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!username || !password) {
    redirect("/login?error=missing");
  }

  let email = username;

  if (!username.includes("@")) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: profile } = await admin
        .from("admin_profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (!profile) {
        redirect("/login?error=invalid");
      }

      const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(profile.id);

      if (getUserError || !authUser.user?.email) {
        redirect("/login?error=invalid");
      }

      email = authUser.user.email;
    } catch {
      redirect("/login?error=invalid");
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
