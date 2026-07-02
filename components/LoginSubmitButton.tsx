"use client";

import { useFormStatus } from "react-dom";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className="min-h-11 rounded-lg bg-adminBlue text-sm font-black text-white disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
