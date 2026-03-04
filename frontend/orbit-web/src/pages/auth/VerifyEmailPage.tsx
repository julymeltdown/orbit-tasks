import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

interface VerifyResponse {
  userId: string;
  status: string;
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("email");
    const fromSession = sessionStorage.getItem("orbit.signup.email");
    const resolved = fromQuery || fromSession || "";
    if (!resolved) {
      navigate("/signup", { replace: true });
      return;
    }
    setEmail(resolved);
    sessionStorage.setItem("orbit.signup.email", resolved);
  }, [location.search, navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setIsLoading(true);
    try {
      await request<VerifyResponse>("/auth/email/verify", {
        method: "POST",
        skipAuth: true,
        body: { email, code }
      });
      sessionStorage.removeItem("orbit.signup.email");
      navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증 코드 확인에 실패했습니다.");
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
          <Link className="orbit-link-button" to="/login">
            Login
          </Link>
        </div>
      </header>

      <main className="orbit-auth-layout">
        <section className="orbit-auth-pane">
          <p className="orbit-auth-eyebrow">Step 3</p>
          <h1 className="orbit-auth-title">Verify Email</h1>
          <p className="orbit-auth-copy">수신한 인증 코드를 입력하면 가입이 완료되고 로그인할 수 있습니다.</p>
        </section>

        <section className="orbit-auth-pane">
          <form className="orbit-auth-form" onSubmit={onSubmit}>
            <label className="orbit-auth-field">
              <span>Email</span>
              <input className="orbit-input" type="email" value={email} readOnly />
            </label>
            <label className="orbit-auth-field">
              <span>Verification Code</span>
              <input
                className="orbit-input"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                required
              />
            </label>

            {error && (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="orbit-auth-row">
              <Link className="orbit-auth-link" to="/login">
                로그인으로 이동
              </Link>
              <button className="orbit-button" type="submit" disabled={isLoading || code.trim().length === 0}>
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
