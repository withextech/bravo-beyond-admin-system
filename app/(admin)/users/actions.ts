"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/password-policy";

function redirectWithStatus(status: string): never {
  redirect(`/users?status=${encodeURIComponent(status)}`);
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function isValidUsername(username: string) {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

function normalizeRole(role: string) {
  return role === "admin" ? "admin" : "editor";
}

function isMissingUsernameColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("username"));
}

export async function createAdminUser(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = normalizeUsername(String(formData.get("username") || ""));
  const fullName = String(formData.get("full_name") || "").trim();
  const role = normalizeRole(String(formData.get("role") || "editor"));
  const password = String(formData.get("password") || "");

  if (!email || !username || !fullName || !password) {
    redirectWithStatus("missing-fields");
  }

  if (!isValidUsername(username)) {
    redirectWithStatus("username-rule");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirectWithStatus("password-rule");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username,
      must_change_password: true
    }
  });

  if (error || !data.user) {
    redirectWithStatus("create-failed");
  }

  const createdUser = data.user;

  const { error: profileError } = await admin.from("admin_profiles").upsert({
    id: createdUser.id,
    username,
    full_name: fullName,
    role,
    must_change_password: true,
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    if (isMissingUsernameColumn(profileError)) {
      await admin.auth.admin.deleteUser(createdUser.id);
      redirectWithStatus("username-setup-required");
    }
    await admin.auth.admin.deleteUser(createdUser.id);
    redirectWithStatus("profile-failed");
  }

  revalidatePath("/users");
  redirectWithStatus("user-created");
}

export async function updateAdminUser(formData: FormData) {
  const id = String(formData.get("id") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = normalizeUsername(String(formData.get("username") || ""));
  const fullName = String(formData.get("full_name") || "").trim();
  const role = normalizeRole(String(formData.get("role") || "editor"));

  if (!id || !email || !username || !fullName) {
    redirectWithStatus("missing-fields");
  }

  if (!isValidUsername(username)) {
    redirectWithStatus("username-rule");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("admin_profiles").upsert({
    id,
    username,
    full_name: fullName,
    role,
    updated_at: new Date().toISOString()
  });

  if (error) {
    if (isMissingUsernameColumn(error)) {
      redirectWithStatus("username-setup-required");
    }
    redirectWithStatus("update-failed");
  }

  await admin.auth.admin.updateUserById(id, {
    email,
    user_metadata: {
      username,
      full_name: fullName,
      role
    }
  });

  revalidatePath("/users");
  revalidatePath("/");
  redirectWithStatus("user-updated");
}

export async function resetAdminUserPassword(formData: FormData) {
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");

  if (!id || !password) {
    redirectWithStatus("missing-fields");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirectWithStatus("password-rule");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password,
    user_metadata: {
      must_change_password: true
    }
  });

  if (error) {
    redirectWithStatus("reset-failed");
  }

  const { error: profileError } = await admin.from("admin_profiles").update({
    must_change_password: true,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  if (profileError) {
    redirectWithStatus("reset-profile-failed");
  }

  revalidatePath("/users");
  redirectWithStatus("password-reset");
}

export async function deleteAdminUser(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    redirectWithStatus("missing-fields");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (current.user?.id === id) {
    redirectWithStatus("cannot-delete-self");
  }

  const admin = createSupabaseAdminClient();
  await admin.from("admin_profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    redirectWithStatus("delete-failed");
  }

  revalidatePath("/users");
  redirectWithStatus("user-deleted");
}

export async function suspendAdminUser(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    redirectWithStatus("missing-fields");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (current.user?.id === id) {
    redirectWithStatus("cannot-suspend-self");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "876000h"
  } as never);

  if (error) {
    redirectWithStatus("suspend-failed");
  }

  revalidatePath("/users");
  redirectWithStatus("user-suspended");
}

export async function activateAdminUser(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    redirectWithStatus("missing-fields");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "none"
  } as never);

  if (error) {
    redirectWithStatus("activate-failed");
  }

  revalidatePath("/users");
  redirectWithStatus("user-activated");
}

export async function updateOwnProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();

  if (!fullName) {
    redirectWithStatus("missing-fields");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (!current.user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("admin_profiles").update({
    full_name: fullName,
    updated_at: new Date().toISOString()
  }).eq("id", current.user.id);

  if (error) {
    redirectWithStatus("profile-update-failed");
  }

  await admin.auth.admin.updateUserById(current.user.id, {
    user_metadata: {
      full_name: fullName
    }
  });

  revalidatePath("/users");
  revalidatePath("/");
  redirectWithStatus("profile-updated");
}
