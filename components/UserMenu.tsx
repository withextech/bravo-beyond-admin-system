import { UserMenuClient } from "@/components/UserMenuClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "A";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export async function UserMenu() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let displayName = user?.user_metadata?.full_name || user?.email || "Admin";
  let roleLabel = "Admin";

  if (user?.id) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    displayName = profile?.full_name || displayName;
    roleLabel = (profile?.role || user.user_metadata?.role) === "editor" ? "Editor" : "Admin";
  }

  return <UserMenuClient displayName={displayName} initials={getInitials(displayName)} roleLabel={roleLabel} />;
}
