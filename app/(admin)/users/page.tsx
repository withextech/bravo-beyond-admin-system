import {
  createAdminUser,
} from "@/app/(admin)/users/actions";
import { UserActionsModal } from "@/components/UserActionsModal";
import { passwordPolicyText } from "@/lib/password-policy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UsersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusMessages: Record<string, string> = {
  "missing-fields": "Complete the required fields.",
  "username-setup-required": "Usernames are not enabled in Supabase yet. Run supabase/user-management-update.sql in the Supabase SQL Editor.",
  "username-rule": "Username must be 3 to 32 characters using lowercase letters, numbers, dot, dash, or underscore.",
  "password-rule": passwordPolicyText,
  "create-failed": "User could not be created. Check the username and email, then try again.",
  "profile-failed": "User auth was created, but the profile record failed.",
  "user-created": "User created. They must change the initial password on first login.",
  "update-failed": "User profile could not be updated.",
  "user-updated": "User profile updated.",
  "reset-failed": "Password could not be reset.",
  "reset-profile-failed": "Password reset, but profile status could not be updated.",
  "password-reset": "Password reset. The user must change it on next login.",
  "cannot-delete-self": "You cannot remove your own account.",
  "cannot-suspend-self": "You cannot suspend your own account.",
  "delete-failed": "User could not be removed.",
  "user-deleted": "User removed.",
  "suspend-failed": "User could not be suspended.",
  "user-suspended": "User suspended.",
  "activate-failed": "User could not be activated.",
  "user-activated": "User activated.",
  "profile-update-failed": "Your profile could not be updated.",
  "profile-updated": "Your display name was updated."
};

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" }
];

function getStatusTone(status?: string) {
  if (!status) {
    return "";
  }

  return status.includes("failed") || status.includes("missing") || status.includes("rule") || status.includes("cannot")
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  let adminSetupMissing = false;
  let usernameSetupMissing = false;
  let users: Array<{
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    must_change_password: boolean;
    is_suspended: boolean;
    created_at: string;
  }> = [];

  try {
    const admin = createSupabaseAdminClient();
    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
    let { data: profiles, error: profilesError } = await admin
      .from("admin_profiles")
      .select("id, username, full_name, role, must_change_password, created_at");

    if (profilesError?.message.includes("username")) {
      usernameSetupMissing = true;
      const fallback = await admin
        .from("admin_profiles")
        .select("id, full_name, role, must_change_password, created_at");
      profiles = fallback.data?.map((profile) => ({ ...profile, username: "" })) || [];
    } else if (profilesError) {
      throw profilesError;
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    users = (authUsers.users || []).map((user) => {
      const profile = profileMap.get(user.id);
      const bannedUntil = user.banned_until ? new Date(user.banned_until).getTime() : 0;
      const metadataRole = user.user_metadata?.role === "admin" ? "admin" : "editor";

      return {
        id: user.id,
        email: user.email || "",
        username: profile?.username || user.user_metadata?.username || "",
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "Admin",
        role: profile?.role || metadataRole,
        must_change_password: profile?.must_change_password || user.user_metadata?.must_change_password === true,
        is_suspended: bannedUntil > Date.now(),
        created_at: profile?.created_at || user.created_at || ""
      };
    });
  } catch {
    adminSetupMissing = true;
  }

  const status = params.status;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-panel lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-950">User Management</h1>
        </div>

        <details className="user-management-panel">
          <summary>Add User</summary>
          <form action={createAdminUser} className="user-management-form">
            <label>
              Full name
              <input name="full_name" required />
            </label>
            <label>
              Username
              <input name="username" placeholder="jane.admin" required />
            </label>
            <label>
              Email address
              <input name="email" required type="email" />
            </label>
            <label>
              Role
              <select name="role" defaultValue="editor">
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            <label>
              Initial password
              <input name="password" required type="password" />
            </label>
            <p>{passwordPolicyText}</p>
            <button disabled={adminSetupMissing} type="submit">Create user</button>
          </form>
        </details>
      </div>

      {status ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-black ${getStatusTone(status)}`}>
          {statusMessages[status] || "Action completed."}
        </div>
      ) : null}

      {adminSetupMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Set `SUPABASE_SECRET_KEY` in `.env.local` to enable Auth user listing and account actions.
        </div>
      ) : null}

      {usernameSetupMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Usernames are not enabled in Supabase yet. Run `supabase/user-management-update.sql` in the Supabase SQL Editor before editing users or logging in by username.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Users</h2>
          </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-adminBlue">{users.length} users</span>
          </div>

        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th colSpan={7}>
                  <div className="user-table-grid user-table-header">
                    <span>Name</span>
                    <span>Username</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td colSpan={7} className="user-expand-cell">
                    <div className="user-row-details">
                      <div className="user-table-grid user-data-row">
                        <span>
                          <strong>{user.full_name}</strong>
                          {current.user?.id === user.id ? <small>You</small> : null}
                        </span>
                        <span>{user.username || "-"}</span>
                        <span>{user.email || "-"}</span>
                        <span>{user.role === "admin" ? "Admin" : "Editor"}</span>
                        <span>
                          <span className={`user-status ${user.is_suspended ? "user-status-red" : user.must_change_password ? "user-status-amber" : "user-status-green"}`}>
                            {user.is_suspended ? "Suspended" : user.must_change_password ? "Password change" : "Active"}
                          </span>
                        </span>
                        <span>{formatDate(user.created_at)}</span>
                        <span>
                          <UserActionsModal
                            adminSetupMissing={adminSetupMissing}
                            currentUserId={current.user?.id}
                            roleOptions={roleOptions}
                            user={user}
                          />
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 ? (
                <tr>
                  <td colSpan={7}>No admin users loaded yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
