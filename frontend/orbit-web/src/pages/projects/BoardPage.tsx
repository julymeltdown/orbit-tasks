export function BoardPage() {
  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 4", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Backlog</h3>
        <div className="orbit-panel" style={{ padding: 12 }}>Define dependency graph schema</div>
      </article>
      <article className="orbit-card" style={{ gridColumn: "span 4", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>In Progress</h3>
        <div className="orbit-panel" style={{ padding: 12 }}>Implement cycle guard</div>
      </article>
      <article className="orbit-card" style={{ gridColumn: "span 4", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Done</h3>
        <div className="orbit-panel" style={{ padding: 12 }}>Ship board baseline</div>
      </article>
    </section>
  );
}
