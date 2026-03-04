import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchProfileCompletion } from "@/lib/auth/profileCompletion";
import { request } from "@/lib/http/client";
import { resolveReturnTo, stashIntent } from "@/lib/routing/restoreIntent";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

interface LoginResponse {
  userId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hydrated, accessToken, setSession } = useAuthStore();

  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("returnTo");
  }, [location.search]);

  const [email, setEmail] = useState("hana@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("email");
    if (fromQuery) {
      setEmail(fromQuery);
    }
  }, [location.search]);

  async function routeAfterAuth(explicitReturnTo?: string | null) {
    const nextPath = resolveReturnTo(explicitReturnTo, "/app/workspace/select");
    const completion = await fetchProfileCompletion();
    if (!completion.complete) {
      stashIntent(nextPath);
      navigate(`/onboarding/profile?returnTo=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }
    navigate(nextPath, { replace: true });
  }

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }
    routeAfterAuth(returnTo).catch((e) => {
      setError(e instanceof Error ? e.message : "Unable to continue session");
    });
  }, [hydrated, accessToken, returnTo]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await request<LoginResponse>("/auth/login", {
        method: "POST",
        skipAuth: true,
        body: { email, password }
      });

      setSession({
        userId: result.userId,
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn
      });

      await routeAfterAuth(returnTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="orbit-public">
      <header className="orbit-public__header">
        <div className="orbit-public__brand">
          <span className="orbit-public__brand-mark">O</span>
          <span>Orbit Tasks</span>
        </div>
        <div className="orbit-public__actions">
          <ThemeToggleButton />
          <Link className="orbit-link-button" to="/">
            Landing
          </Link>
          <Link className="orbit-link-button orbit-link-button--accent" to="/signup">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="orbit-auth-layout">
        <section className="orbit-auth-pane">
          <p className="orbit-auth-eyebrow">Sign In</p>
          <h1 className="orbit-auth-title">Welcome Back</h1>
          <p className="orbit-auth-copy">
            로그인 후 즉시 워크스페이스 진입하며, 최초 1회는 프로필 완료 후 사용 가능합니다.
          </p>
          <div className="orbit-metric-grid" style={{ marginTop: 20 }}>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Threads</p>
              <p className="orbit-metric__value">Realtime</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Mentions</p>
              <p className="orbit-metric__value">Synced</p>
            </div>
          </div>
        </section>

        <section className="orbit-auth-pane">
          <form className="orbit-auth-form" onSubmit={onSubmit}>
            <label className="orbit-auth-field">
              <span>Email</span>
              <input
                className="orbit-input"
                aria-label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="orbit-auth-field">
              <span>Password</span>
              <input
                className="orbit-input"
                aria-label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="orbit-auth-row">
              <Link className="orbit-auth-link" to="/signup">
                계정이 없다면 회원가입
              </Link>
              <button className="orbit-button" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
