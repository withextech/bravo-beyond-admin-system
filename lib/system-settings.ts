import { createSupabaseServerClient } from "@/lib/supabase/server";

const SETTINGS = {
  sessionInactivityMinutes: "session_inactivity_minutes",
  inquiryRecipientEmails: "inquiry_recipient_emails"
} as const;

export const systemSettingDefaults = {
  sessionInactivityMinutes: 60,
  inquiryRecipientEmails: ""
};

export type SystemSettings = {
  sessionInactivityMinutes: number;
  inquiryRecipientEmails: string;
};

function normalizeRecipientList(value: string | null | undefined) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("system_settings").select("key,value");

    if (!error && data && data.length) {
      const values = Object.fromEntries(data.map((item) => [item.key, item.value]));
      const timeoutValue = Number(values[SETTINGS.sessionInactivityMinutes]);
      const timeout = Number.isFinite(timeoutValue) ? Math.max(1, Math.min(10080, Math.trunc(timeoutValue))) : systemSettingDefaults.sessionInactivityMinutes;

      return {
        sessionInactivityMinutes: timeout,
        inquiryRecipientEmails: normalizeRecipientList(values[SETTINGS.inquiryRecipientEmails])
      };
    }
  } catch {
    // Table may not yet exist or DB call may fail in initial bootstrap states.
  }

  return { ...systemSettingDefaults };
}
