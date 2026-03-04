export function BoardPage() {
  return (
    <section className="orbit-board" aria-label="Kanban board">
      <article className="orbit-card orbit-board__lane">
        <h3 className="orbit-board__title">Backlog</h3>
        <div className="orbit-board__cards">
          <div className="orbit-panel" style={{ padding: 12 }}>Define dependency graph schema</div>
          <div className="orbit-panel" style={{ padding: 12 }}>Triage @mentions backlog</div>
          <div className="orbit-panel" style={{ padding: 12 }}>Plan sprint spillover</div>
        </div>
      </article>
      <article className="orbit-card orbit-board__lane">
        <h3 className="orbit-board__title">In Progress</h3>
        <div className="orbit-board__cards">
          <div className="orbit-panel" style={{ padding: 12 }}>Implement cycle guard</div>
          <div className="orbit-panel" style={{ padding: 12 }}>Thread mention notification fanout</div>
        </div>
      </article>
      <article className="orbit-card orbit-board__lane">
        <h3 className="orbit-board__title">Done</h3>
        <div className="orbit-board__cards">
          <div className="orbit-panel" style={{ padding: 12 }}>Ship board baseline</div>
          <div className="orbit-panel" style={{ padding: 12 }}>Deep link resolver</div>
        </div>
      </article>
    </section>
  );
}
