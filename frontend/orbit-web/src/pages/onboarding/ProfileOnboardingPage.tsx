import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BasicProfile, fetchProfileCompletion, isProfileComplete } from "@/lib/auth/profileCompletion";
import { getApiBaseUrl, request } from "@/lib/http/client";
import { resolveReturnTo, stashIntent } from "@/lib/routing/restoreIntent";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

interface AvatarUploadResponse {
  avatarUrl: string;
}

interface ProfileUpdateResponse {
  userId: string;
  username: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
}

export function ProfileOnboardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("returnTo");
  }, [location.search]);

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    fetchProfileCompletion()
      .then((result) => {
        const profile = result.profile;
        if (profile) {
          setUsername(profile.username ?? "");
          setNickname(profile.nickname ?? "");
          setBio(profile.bio ?? "");
          setAvatarUrl(profile.avatarUrl ?? "");
        }
        if (result.complete) {
          navigate(resolveReturnTo(returnTo, "/app/workspace/select"), { replace: true });
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "프로필 상태를 조회하지 못했습니다.");
      });
  }, [userId, navigate, returnTo]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function toAbsoluteAvatarUrl(rawUrl: string): string {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    return `${getApiBaseUrl()}${rawUrl}`;
  }

  async function ensureAvatarUrl(): Promise<string> {
    if (avatarFile) {
      const form = new FormData();
      form.append("file", avatarFile);
      const upload = await request<AvatarUploadResponse>("/api/profile/avatar", {
        method: "POST",
        body: form,
        isFormData: true
      });
      return toAbsoluteAvatarUrl(upload.avatarUrl);
    }
    return avatarUrl;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const resolvedAvatarUrl = await ensureAvatarUrl();

      const payload = {
        username: username.trim(),
        nickname: nickname.trim(),
        avatarUrl: resolvedAvatarUrl.trim(),
        bio: bio.trim()
      };
      if (!isProfileComplete(payload as BasicProfile)) {
        setError("username, nickname, avatar, bio를 모두 입력해 주세요.");
        return;
      }

      await request<ProfileUpdateResponse>(`/api/profile/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: payload
      });

      const nextPath = resolveReturnTo(returnTo, "/app/workspace/select");
      stashIntent(nextPath);
      navigate(nextPath, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로필 저장에 실패했습니다.");
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
          <Link className="orbit-link-button" to="/app/profile">
            Profile
          </Link>
        </div>
      </header>

      <main className="orbit-onboarding-wrap">
        <section className="orbit-auth-pane">
          <p className="orbit-auth-eyebrow">First Login Setup</p>
          <h1 className="orbit-auth-title">Complete Profile</h1>
          <p className="orbit-auth-copy">
            최초 로그인 1회에 한해 프로필 기본 정보를 완료해야 워크스페이스를 사용할 수 있습니다.
          </p>
          <div className="orbit-metric-grid">
            <div className="orbit-metric">
              <p className="orbit-metric__label">Required</p>
              <p className="orbit-metric__value">4 Fields</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Next Login</p>
              <p className="orbit-metric__value">Direct Entry</p>
            </div>
          </div>
        </section>

        <section className="orbit-auth-pane">
          <form className="orbit-auth-form" onSubmit={onSubmit}>
            <label className="orbit-auth-field">
              <span>Username</span>
              <input
                className="orbit-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="orbit_user"
                required
              />
            </label>

            <label className="orbit-auth-field">
              <span>Display Name</span>
              <input
                className="orbit-input"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Your Name"
                required
              />
            </label>

            <label className="orbit-auth-field">
              <span>Avatar</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="orbit-onboarding-avatar">
                  {avatarPreview || avatarUrl ? (
                    <img alt="Avatar preview" src={avatarPreview || avatarUrl} />
                  ) : (
                    (nickname || username || "OR").slice(0, 2)
                  )}
                </div>
                <input
                  className="orbit-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    if (avatarPreview) {
                      URL.revokeObjectURL(avatarPreview);
                    }
                    setAvatarPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </div>
              <input
                className="orbit-input"
                placeholder="or paste avatar URL"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
            </label>

            <label className="orbit-auth-field">
              <span>Bio</span>
              <textarea
                className="orbit-input orbit-onboarding-textarea"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
              />
            </label>

            {error && (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="orbit-auth-row">
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>완료 후 앱 사용 가능</span>
              <button className="orbit-button" type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
