"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEM_SETTINGS_KEY_TIMEOUT = "session_inactivity_minutes";
const SYSTEM_SETTINGS_KEY_RECIPIENTS = "inquiry_recipient_emails";
const SESSION_MINUTES_MIN = 1;
const SESSION_MINUTES_MAX = 10080;

function normalizeEmails(value: string) {
  const entries = value
    .split(/[\n,]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return entries;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function redirectWithStatus(status: string): never {
  redirect(`/settings?status=${encodeURIComponent(status)}`);
}

export async function saveSystemSettings(formData: FormData) {
  const timeoutRaw = Number(String(formData.get("session_inactivity_minutes") || ""));
  const recipientsRaw = String(formData.get("inquiry_recipient_emails") || "");

  if (!Number.isFinite(timeoutRaw) || Math.trunc(timeoutRaw) !== timeoutRaw) {
    redirectWithStatus("invalid-timeout");
  }

  const timeoutMinutes = Math.max(SESSION_MINUTES_MIN, Math.min(SESSION_MINUTES_MAX, timeoutRaw));
  const recipients = normalizeEmails(recipientsRaw);

  if (recipients.some((email) => !isValidEmail(email))) {
    redirectWithStatus("invalid-email");
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentUser } = await supabase.auth.getUser();
  const updatedBy = currentUser.user?.id || null;

  if (!currentUser.user) {
    redirectWithStatus("session-expired");
  }

  const admin = await createSupabaseServerClient();

  const updates = [
    {
      key: SYSTEM_SETTINGS_KEY_TIMEOUT,
      value: String(timeoutMinutes),
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    },
    {
      key: SYSTEM_SETTINGS_KEY_RECIPIENTS,
      value: recipients.join(", "),
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await admin
    .from("system_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) {
    redirectWithStatus(
      error.message.includes("system_settings") ? "table-missing" : "save-failed"
    );
  }

  revalidatePath("/settings");
  revalidatePath("/");
  redirectWithStatus("saved");
}
