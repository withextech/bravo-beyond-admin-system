"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/password-policy";

export type PasswordChangeState = {
  message: string;
  status: "idle" | "error" | "success";
};

export async function changeOwnPassword(
  _state: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!password || !confirmPassword) {
    return { status: "error", message: "Enter and confirm your new password." };
  }

  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { status: "error", message: passwordError };
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (!current.user) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "Password could not be updated. Try again." };
  }

  const admin = createSupabaseAdminClient();
  await admin.auth.admin.updateUserById(current.user.id, {
    user_metadata: {
      must_change_password: false
    }
  });
  await admin.from("admin_profiles").update({
    must_change_password: false,
    updated_at: new Date().toISOString()
  }).eq("id", current.user.id);

  return { status: "success", message: "Password updated." };
}
