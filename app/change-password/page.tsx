import { changeRequiredPassword } from "@/app/change-password/actions";
import { SessionTimeout } from "@/components/SessionTimeout";
import { passwordPolicyText } from "@/lib/password-policy";

type ChangePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages = {
  missing: "Enter and confirm your new password.",
  mismatch: "Passwords do not match.",
  policy: passwordPolicyText,
  update: "Password could not be updated. Try again.",
  profile: "Password changed, but profile status could not be updated. Contact an admin."
};

export default async function ChangePasswordPage({ searchParams }: ChangePasswordPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error as keyof typeof errorMessages] : null;

  return (
    <main className="password-change-page">
      <SessionTimeout />
      <form action={changeRequiredPassword} className="password-change-card">
        <p className="login-form-eyebrow">Password Required</p>
        <h1>Change Password</h1>
        <p>{passwordPolicyText}</p>
        {error ? <div className="login-error">{error}</div> : null}
        <div className="login-form-fields">
          <label>
            New password
            <input autoComplete="new-password" name="password" required type="password" />
          </label>
          <label>
            Confirm password
            <input autoComplete="new-password" name="confirm_password" required type="password" />
          </label>
          <button type="submit">Update password</button>
        </div>
      </form>
    </main>
  );
}
