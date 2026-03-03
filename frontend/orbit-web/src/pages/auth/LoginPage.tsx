import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { resolveReturnTo } from "@/lib/routing/restoreIntent";

interface LoginResponse {
  userId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("returnTo") || "/workspace/select";
  }, [location.search]);

  const [email, setEmail] = useState("admin@orbit.local");
  const [password, setPassword] = useState("orbit1234");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      localStorage.setItem("orbit.session.accessToken", result.accessToken);
      localStorage.setItem("orbit.session.userId", result.userId);
      localStorage.setItem("orbit.session.tokenType", result.tokenType);
      localStorage.setItem("orbit.session.expiresIn", String(result.expiresIn));

      navigate(resolveReturnTo(returnTo), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "10vh auto", padding: 24 }} className="orbit-panel">
      <h1 className="orbit-heading-xl" style={{ margin: "0 0 20px" }}>
        Orbit Login
      </h1>
      <p style={{ color: "var(--orbit-text-subtle)", marginTop: 0 }}>
        Enterprise workspace authentication with session bootstrap.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Email
          </span>
          <input
            className="orbit-input"
            aria-label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Password
          </span>
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
          <p style={{ margin: 0, color: "var(--orbit-danger)", fontSize: 13 }} role="alert">
            {error}
          </p>
        )}

        <button className="orbit-button" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
