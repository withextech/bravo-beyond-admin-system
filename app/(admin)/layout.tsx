import { AdminShell } from "@/components/AdminShell";
import { SessionTimeout } from "@/components/SessionTimeout";
import { UserMenu } from "@/components/UserMenu";
import { getSystemSettings } from "@/lib/system-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSystemSettings();
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();
  const { data: profile } = current.user
    ? await supabase.from("admin_profiles").select("role").eq("id", current.user.id).maybeSingle()
    : { data: null };
  const role = profile?.role || current.user?.user_metadata?.role || "admin";

  return (
    <AdminShell
      role={role}
      sessionTimeout={<SessionTimeout inactivityMinutes={settings.sessionInactivityMinutes} />}
      userMenu={<UserMenu />}
    >
      {children}
    </AdminShell>
  );
}
