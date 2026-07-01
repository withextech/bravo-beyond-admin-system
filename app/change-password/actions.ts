"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/password-policy";

export async function changeRequiredPassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!password || !confirmPassword) {
    redirect("/change-password?error=missing");
  }

  if (password !== confirmPassword) {
    redirect("/change-password?error=mismatch");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirect("/change-password?error=policy");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (!current.user) {
    redirect("/login");
  }

  const { error: passwordUpdateError } = await supabase.auth.updateUser({ password });
  if (passwordUpdateError) {
    redirect("/change-password?error=update");
  }

  const admin = createSupabaseAdminClient();
  await admin.auth.admin.updateUserById(current.user.id, {
    user_metadata: {
      must_change_password: false
    }
  });

  const { error: profileError } = await admin.from("admin_profiles").update({
    must_change_password: false,
    updated_at: new Date().toISOString()
  }).eq("id", current.user.id);

  if (profileError) {
    redirect("/change-password?error=profile");
  }

  redirect("/");
}
