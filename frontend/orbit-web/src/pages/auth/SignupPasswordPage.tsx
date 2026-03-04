import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

interface SignupResponse {
  userId: string;
  status: string;
}

export function SignupPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
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

  const passwordValid = useMemo(() => {
    const lengthOk = password.length >= 8 && password.length <= 128;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return lengthOk && hasLetter && hasNumber;
  }, [password]);
  const workspaceNameValid = useMemo(() => {
    const normalized = workspaceName.trim();
    return normalized.length >= 2 && normalized.length <= 60;
  }, [workspaceName]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!passwordValid) {
      setError("비밀번호는 8~128자, 영문/숫자를 포함해야 합니다.");
      return;
    }
    if (!workspaceNameValid) {
      setError("워크스페이스 이름은 2~60자로 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await request<SignupResponse>("/auth/email/signup", {
        method: "POST",
        skipAuth: true,
        body: { email, password, workspaceName: workspaceName.trim() }
      });
      navigate(`/verify?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "회원가입 중 오류가 발생했습니다.");
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
          <p className="orbit-auth-eyebrow">Step 2</p>
          <h1 className="orbit-auth-title">Create Password</h1>
          <p className="orbit-auth-copy">
            이메일 확인 코드를 발송하기 위해 계정을 생성합니다. 이메일 인증 완료 후 로그인 가능합니다.
          </p>
        </section>

        <section className="orbit-auth-pane">
          <form className="orbit-auth-form" onSubmit={onSubmit}>
            <label className="orbit-auth-field">
              <span>Email</span>
              <input className="orbit-input" type="email" value={email} readOnly />
            </label>

            <label className="orbit-auth-field">
              <span>Password</span>
              <input
                className="orbit-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <label className="orbit-auth-field">
              <span>Workspace Name</span>
              <input
                className="orbit-input"
                type="text"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="ex) Product Delivery"
                minLength={2}
                maxLength={60}
                required
              />
            </label>

            {workspaceName.trim().length > 0 && workspaceNameValid && (
              <p className="orbit-auth-success">워크스페이스 이름이 설정됩니다.</p>
            )}

            {password.length > 0 && passwordValid && (
              <p className="orbit-auth-success">사용 가능한 비밀번호 형식입니다.</p>
            )}

            {error && (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="orbit-auth-row">
              <Link className="orbit-auth-link" to="/signup">
                이메일 다시 입력
              </Link>
              <button className="orbit-button" type="submit" disabled={isLoading || !passwordValid || !workspaceNameValid}>
                {isLoading ? "Creating..." : "Send Verify Code"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
