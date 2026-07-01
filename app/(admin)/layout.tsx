import { AdminSidebar } from "@/components/AdminSidebar";
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
    <div className="admin-shell-grid">
      <SessionTimeout inactivityMinutes={settings.sessionInactivityMinutes} />
      <AdminSidebar role={role} />
      <div className="admin-content min-w-0">
        <header className="admin-topbar">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-adminBlue">Bravo & Beyond</p>
            <strong>Admin System</strong>
          </div>
          <UserMenu />
        </header>
        <main className="p-5 pt-0 md:p-8 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
