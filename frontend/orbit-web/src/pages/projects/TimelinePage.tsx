export function TimelinePage() {
  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Timeline / Calendar</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Work item durations and dependency links are rendered in timeline mode.
        </p>
        <div className="orbit-panel" style={{ padding: 14 }}>
          2026-03-03 to 2026-03-14 : Sprint Orbit-09
        </div>
      </article>
    </section>
  );
}
