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

      <main className="orbit-public__hero orbit-public__hero--editorial">
        <section className="orbit-hero-card orbit-hero-card--editorial">
          <p className="orbit-auth-eyebrow">Enterprise Task Intelligence</p>
          <h1 className="orbit-hero-title">
            Orbit Your
            <br />
            <span>Workflow</span>
          </h1>
          <p className="orbit-hero-copy">
            스프린트 보드, 타임라인 스케줄, 스레드/멘션 협업, LLM 일정 진단을 하나의 운영 화면으로 연결합니다.
          </p>

          <div className="orbit-hero-health">
            <p className="orbit-hero-health__value">94%</p>
            <p className="orbit-hero-health__label">System Schedule Health</p>
          </div>

          <div className="orbit-hero-timeline">
            <div className="orbit-hero-timeline__item">
              <span>09:00</span>
              <strong>Core Engine Sync</strong>
            </div>
            <div className="orbit-hero-timeline__item">
              <span>11:30</span>
              <strong>Edge Node Validation</strong>
            </div>
            <div className="orbit-hero-timeline__item">
              <span>14:00</span>
              <strong>Global Rollout</strong>
            </div>
          </div>
        </section>

        <aside className="orbit-hero-stack">
          <article className="orbit-hero-card">
            <h2 className="orbit-auth-title">Resource Load</h2>
            <p className="orbit-auth-copy">12개 분산 팀 기준 용량을 실시간으로 리밸런싱합니다.</p>
            <div className="orbit-resource-bars" aria-hidden>
              <span style={{ height: "24%" }} />
              <span style={{ height: "64%" }} />
              <span style={{ height: "100%" }} />
              <span style={{ height: "48%" }} />
              <span style={{ height: "76%" }} />
              <span style={{ height: "34%" }} />
              <span style={{ height: "86%" }} />
            </div>
          </article>

          <article className="orbit-hero-card orbit-hero-card--accent">
            <p className="orbit-auth-eyebrow">Propel Mode</p>
            <h2 className="orbit-auth-title">Automate Backlog</h2>
            <p className="orbit-auth-copy">
              블로커를 감지하면 스레드 생성, 멘션 알림, 스프린트 권고까지 자동으로 이어집니다.
            </p>
          </article>
        </aside>
      </main>

      <section className="orbit-public__board-preview">
        <article className="orbit-preview-column">
          <h3>Backlog</h3>
          <div className="orbit-preview-card">Visual identity rebrand</div>
          <div className="orbit-preview-card">Cinematic color profiles</div>
        </article>
        <article className="orbit-preview-column orbit-preview-column--active">
          <h3>Active</h3>
          <div className="orbit-preview-card orbit-preview-card--accent">Rotating typography module</div>
          <div className="orbit-preview-card">Glass overlay iteration</div>
        </article>
        <article className="orbit-preview-column">
          <h3>Review</h3>
          <div className="orbit-preview-card">Post-production polish</div>
          <div className="orbit-preview-card">Capacity health QA</div>
        </article>
      </section>

      <section className="orbit-public__hero" style={{ marginTop: 0 }}>
        <section className="orbit-hero-card">
          <p className="orbit-auth-eyebrow">What You Get</p>
          <div className="orbit-metric-grid">
            <div className="orbit-metric">
              <p className="orbit-metric__label">Mentions</p>
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
            <div className="orbit-metric">
              <p className="orbit-metric__label">Onboarding</p>
              <p className="orbit-metric__value">First Login Only</p>
            </div>
          </div>
        </section>
        <aside className="orbit-hero-card">
          <p className="orbit-auth-eyebrow">Flow</p>
          <p className="orbit-auth-copy" style={{ marginBottom: 0 }}>
            회원가입 → 이메일 검증 → 로그인 → 최초 프로필 설정 → 워크스페이스 진입. 이후 로그인은 즉시 작업 화면으로 이동합니다.
          </p>
        </aside>
      </section>
    </div>
  );
}
