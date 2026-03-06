import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BasicProfile, fetchProfileCompletion, isProfileComplete } from "@/lib/auth/profileCompletion";
import { getApiBaseUrl, request } from "@/lib/http/client";
import { resolveReturnTo, stashIntent } from "@/lib/routing/restoreIntent";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { ACTION_LABELS } from "@/features/usability";

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
  const [showOptional, setShowOptional] = useState(false);
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
    if (!rawUrl) {
      return "";
    }
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

    const payload: Pick<BasicProfile, "username" | "nickname"> = {
      username: username.trim(),
      nickname: nickname.trim()
    };
    if (!isProfileComplete(payload)) {
      setError("username과 display name은 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      const resolvedAvatarUrl = await ensureAvatarUrl();
      await request<ProfileUpdateResponse>(`/api/profile/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: {
          username: username.trim(),
          nickname: nickname.trim(),
          avatarUrl: resolvedAvatarUrl.trim(),
          bio: bio.trim()
        }
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
          <h1 className="orbit-auth-title">워크스페이스에 들어가기 전에 이름만 정리하세요</h1>
          <p className="orbit-auth-copy">
            처음에는 username과 display name만 있으면 됩니다. 아바타와 소개는 나중에 보완할 수 있습니다.
          </p>
          <div className="orbit-metric-grid">
            <div className="orbit-metric">
              <p className="orbit-metric__label">Required</p>
              <p className="orbit-metric__value">2 Fields</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Optional</p>
              <p className="orbit-metric__value">Avatar · Bio</p>
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
                placeholder="홍길동"
                required
              />
            </label>

            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setShowOptional((value) => !value)}>
              {showOptional ? "선택 입력 접기" : "아바타와 소개 추가"}
            </button>

            {showOptional ? (
              <>
                <label className="orbit-auth-field">
                  <span>Avatar (optional)</span>
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
                  <span>Bio (optional)</span>
                  <textarea
                    className="orbit-input orbit-onboarding-textarea"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="어떤 역할로 일하는지 한 줄 정도 남겨두면 협업에 도움이 됩니다."
                  />
                </label>
              </>
            ) : null}

            {error ? (
              <p className="orbit-auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="orbit-auth-row">
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{ACTION_LABELS.enrichProfileLater}</span>
              <button className="orbit-button" type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "워크스페이스로 계속"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
