import { signOut } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        className="mt-4 w-full rounded-lg border border-white/10 px-4 py-3 text-left text-sm font-black text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        type="submit"
      >
        Logout
      </button>
    </form>
  );
}
