import { signIn } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages = {
  missing: "Enter your username and password.",
  invalid: "Invalid username or password."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error as keyof typeof errorMessages] : null;

  return (
    <main className="login-page">
      <div className="login-background" aria-hidden="true">
        <img
          alt=""
          src="/assets/generated/admin-login-astro-bg.png"
        />
      </div>

      <section className="login-brand-column">
        <div className="login-brand-stage" aria-label="Bravo and Beyond Admin System">
          <div className="login-logo-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="login-logo-panel">
            <img
              src="/assets/bravo-and-beyond-logo-transparent.png"
              alt="Bravo & Beyond"
              className="login-main-logo"
            />
          </div>
          <p className="login-admin-title">
            Admin System
          </p>
        </div>
      </section>

      <section className="login-form-column">
      <form
        action={signIn}
        className="login-form-card"
      >
        <p className="login-form-eyebrow">Secure Login</p>
        <h2>Welcome back</h2>
        <input name="next" type="hidden" value={params.next || "/"} />
        {error ? (
          <div className="login-error">
            {error}
          </div>
        ) : null}
        <div className="login-form-fields">
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              required
              type="text"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="min-h-11 rounded-lg bg-adminBlue text-sm font-black text-white" type="submit">
            Sign in
          </button>
        </div>
      </form>
      </section>
    </main>
  );
}
