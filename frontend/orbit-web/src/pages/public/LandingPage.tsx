import { Link } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

export function LandingPage() {
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
          <Link className="orbit-link-button orbit-link-button--accent" to="/signup">
            Join
          </Link>
        </div>
      </header>

      <main className="orbit-public__hero">
        <section className="orbit-hero-card">
          <h1 className="orbit-hero-title">
            Orbit Your
            <br />
            <span>Task Flow</span>
          </h1>
          <p className="orbit-hero-copy">
            애자일 스프린트 운영, 보드/타임라인 스케줄링, 스레드 기반 협업, 그리고 LLM 일정 진단을 하나의
            엔터프라이즈 워크스페이스로 연결합니다.
          </p>
          <div className="orbit-metric-grid">
            <div className="orbit-metric">
              <p className="orbit-metric__label">Schedule Health</p>
              <p className="orbit-metric__value">94.2%</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Mentions Resolved</p>
              <p className="orbit-metric__value">+37%</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Thread Latency</p>
              <p className="orbit-metric__value">-22%</p>
            </div>
            <div className="orbit-metric">
              <p className="orbit-metric__label">Risk Alerts</p>
              <p className="orbit-metric__value">Realtime</p>
            </div>
          </div>
        </section>

        <aside className="orbit-hero-card">
          <p className="orbit-auth-eyebrow">What You Get</p>
          <h2 className="orbit-auth-title">Task-First Workspace</h2>
          <p className="orbit-auth-copy" style={{ marginBottom: 14 }}>
            로그인 후 바로 프로젝트 보드, 타임라인, 스프린트, 팀/프로필, 인박스 협업 기능으로 진입합니다.
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--orbit-text-subtle)", lineHeight: 1.7 }}>
            <li>스레드, 멘션, 알림 중심 협업</li>
            <li>최초 1회 프로필 완료 게이트</li>
            <li>두 번째 로그인부터 즉시 업무 화면 진입</li>
            <li>딥링크 인증 복귀 및 원위치 이동</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
