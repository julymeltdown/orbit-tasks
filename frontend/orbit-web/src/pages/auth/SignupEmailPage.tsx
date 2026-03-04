import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

interface EmailAvailabilityResponse {
  email: string;
  available: boolean;
  status: string;
}

export function SignupEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!emailValid) {
      setError("유효한 이메일 형식을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await request<EmailAvailabilityResponse>("/auth/email/check", {
        method: "POST",
        skipAuth: true,
        body: { email }
      });

      if (!result.available) {
        setError(result.status === "TAKEN" ? "이미 사용 중인 이메일입니다." : "가입 가능한 이메일이 아닙니다.");
        return;
      }

      sessionStorage.setItem("orbit.signup.email", result.email);
      navigate(`/signup/password?email=${encodeURIComponent(result.email)}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "이메일 확인 중 오류가 발생했습니다.");
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
          <p className="orbit-auth-eyebrow">Step 1</p>
          <h1 className="orbit-auth-title">Email Check</h1>
          <p className="orbit-auth-copy">업무용 이메일 가용성을 확인한 뒤 비밀번호를 설정합니다.</p>
        </section>

        <section className="orbit-auth-pane">
          <form className="orbit-auth-form" onSubmit={onSubmit}>
            <label className="orbit-auth-field">
              <span>Email</span>
              <input
                className="orbit-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            {email.length > 0 && emailValid && <p className="orbit-auth-success">이메일 형식이 올바릅니다.</p>}
            {error && (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="orbit-auth-row">
              <Link className="orbit-auth-link" to="/login">
                이미 계정이 있다면 로그인
              </Link>
              <button className="orbit-button" type="submit" disabled={isLoading || !emailValid}>
                {isLoading ? "Checking..." : "Next"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
