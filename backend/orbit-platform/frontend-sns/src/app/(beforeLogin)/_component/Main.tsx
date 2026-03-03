import Link from "next/link";
import styles from "@/app/(beforeLogin)/_component/main.module.css";

export default function Main() {
  return (
    <div className={styles.page}>
      <div className={styles.grainOverlay} />
      <header className={styles.header}>
        <div className={styles.brandWrap}>
          <div className={styles.brandMark}>O</div>
          <div className={styles.brandText}>ORBIT SCHEDULE</div>
        </div>
        <nav className={styles.topNav}>
          <a href="#overview">Overview</a>
          <a href="#workflow">Workflow</a>
          <a href="#intelligence">Intelligence</a>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/auth/login" className={styles.headerLogin}>
            Login
          </Link>
          <Link href="/auth/signup" className={styles.headerJoin}>
            Join
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section id="overview" className={styles.hero}>
          <p className={styles.heroTag}>Enterprise Schedule Operations</p>
          <h1 className={styles.heroTitle}>
            Orbit Your
            <br />
            Workflow
          </h1>
          <p className={styles.heroCopy}>
            Agile execution and AI schedule diagnostics in one workspace. Align people,
            dependencies, blockers, and milestones in real time.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/auth/signup" className={styles.primaryButton}>
              Create account
            </Link>
            <Link href="/auth/login" className={styles.secondaryButton}>
              Sign in
            </Link>
          </div>
        </section>

        <section id="workflow" className={styles.gridSection}>
          <article className={styles.panel}>
            <div className={styles.panelLabel}>Critical Path Status</div>
            <h2>Project Alpha-09 Deployment</h2>
            <div className={styles.timeline}>
              <div>
                <span>09:00</span>
                <p>Core Engine Sync</p>
              </div>
              <div>
                <span>11:30</span>
                <p>Edge Node Validation</p>
              </div>
              <div>
                <span>14:00</span>
                <p>Global Rollout</p>
              </div>
            </div>
            <div className={styles.metrics}>
              <div>
                <strong>12.4h</strong>
                <small>Time Saved</small>
              </div>
              <div>
                <strong>42</strong>
                <small>Active Tasks</small>
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelLabel}>Resource Load</div>
            <h2>Optimized Across 12 Teams</h2>
            <div className={styles.barChart}>
              <span style={{ height: "32%" }} />
              <span style={{ height: "64%" }} />
              <span style={{ height: "90%" }} />
              <span style={{ height: "52%" }} />
              <span style={{ height: "76%" }} />
              <span style={{ height: "44%" }} />
              <span style={{ height: "82%" }} />
            </div>
            <div className={styles.aiCard}>
              <p className={styles.aiTitle}>Orbit Intelligence</p>
              <p>
                “Current sprint remains on-track. Rebalance one blocked dependency to secure
                Friday milestone.”
              </p>
            </div>
          </article>
        </section>

        <section id="intelligence" className={styles.boardSection}>
          <div className={styles.boardColumn}>
            <h3>Backlog</h3>
            <div className={styles.card}>
              <span className={styles.cardMeta}>Creative Direction</span>
              <p>Visual identity rebrand for Zeit Media</p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardMeta}>Asset Pack</span>
              <p>Cinematic color profile standardization</p>
            </div>
          </div>

          <div className={styles.boardColumn}>
            <h3>Active</h3>
            <div className={`${styles.card} ${styles.activeCard}`}>
              <span className={styles.cardMeta}>In Production</span>
              <p>Rotating Typography Module</p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardMeta}>Interaction</span>
              <p>Glass UI overlays and transition polish</p>
            </div>
          </div>

          <div className={styles.boardColumn}>
            <h3>Review</h3>
            <div className={styles.card}>
              <span className={styles.cardMeta}>QA Phase</span>
              <p>Data visualization heatmap sign-off</p>
            </div>
            <div className={styles.cardMuted}>
              <p>Awaiting assets</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
