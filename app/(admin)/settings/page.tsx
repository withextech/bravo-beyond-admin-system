import { saveSystemSettings } from "./actions";
import { getSystemSettings } from "@/lib/system-settings";

type Status =
  | "saved"
  | "invalid-timeout"
  | "invalid-email"
  | "session-expired"
  | "table-missing"
  | "save-failed";

function getStatusMessage(status: Status | null) {
  switch (status) {
    case "saved":
      return "Settings updated.";
    case "invalid-timeout":
      return "Session timeout must be an integer between 1 and 10,080 minutes.";
    case "invalid-email":
      return "One or more inquiry recipient emails is invalid.";
    case "session-expired":
      return "Your session expired. Please sign in again.";
    case "table-missing":
      return "Settings table is missing in Supabase. Run the new SQL migration.";
    case "save-failed":
      return "We could not save settings. Please try again.";
    default:
      return "";
  }
}

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string | string[];
  }>;
}) {
  const settings = await getSystemSettings();
  const resolvedSearchParams = await searchParams;
  const statusValue = resolvedSearchParams.status;
  const status = (Array.isArray(statusValue) ? statusValue[0] : statusValue || "") as Status | "";
  const statusMessage = getStatusMessage(status || null);
  const recipientsLines = (settings.inquiryRecipientEmails || "").split(", ").filter(Boolean).join("\n");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
      <h1 className="text-4xl font-black text-slate-950">Settings</h1>

      <form action={saveSystemSettings} className="mt-6 space-y-4" noValidate>
        {statusMessage ? <p className="rounded-md bg-slate-950/5 p-3 text-sm text-slate-700">{statusMessage}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border-b border-r border-slate-200 p-3 text-left font-black text-slate-700">Setting</th>
                <th className="border-b border-r border-slate-200 p-3 text-left font-black text-slate-700">Value</th>
                <th className="border-b border-slate-200 p-3 text-left font-black text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-r border-slate-200 p-3 align-top">
                  <label htmlFor="session_inactivity_minutes" className="font-black text-slate-800">
                    Session auto-lock threshold
                  </label>
                </td>
                <td className="border-b border-r border-slate-200 p-3 align-top">
                  <div className="flex max-w-sm items-center gap-2">
                    <input
                      id="session_inactivity_minutes"
                      name="session_inactivity_minutes"
                      className="w-full min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-adminBlue"
                      type="number"
                      min={1}
                      max={10080}
                      step={1}
                      defaultValue={String(settings.sessionInactivityMinutes)}
                      required
                    />
                    <span className="text-xs font-black text-slate-500">minutes</span>
                  </div>
                </td>
                <td className="border-b border-slate-200 p-3 text-xs text-slate-500">
                  Admin users will be signed out automatically after this many minutes of inactivity.
                </td>
              </tr>
              <tr>
                <td className="border-b border-r border-slate-200 p-3 align-top">
                  <label htmlFor="inquiry_recipient_emails" className="font-black text-slate-800">
                    Inquiry recipient list
                  </label>
                </td>
                <td className="border-b border-r border-slate-200 p-3 align-top">
                  <textarea
                    id="inquiry_recipient_emails"
                    name="inquiry_recipient_emails"
                    className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-adminBlue"
                    placeholder="marketing@bravoandbeyond.ph\noperations@bravoandbeyond.ph"
                    defaultValue={recipientsLines}
                  />
                </td>
                <td className="border-b border-slate-200 p-3 text-xs text-slate-500">
                  Comma or line-separated recipient emails for new brand inquiry notifications.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          className="min-h-11 rounded-lg bg-adminBlue px-4 text-sm font-black text-white transition hover:bg-adminBlue/90"
          type="submit"
        >
          Save System Settings
        </button>
      </form>
    </section>
  );
}
