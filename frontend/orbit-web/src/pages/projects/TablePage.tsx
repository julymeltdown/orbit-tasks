export function TablePage() {
  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Table View</h2>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Key</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Assignee</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Due</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px 0" }}>WG-101</td>
                <td>TODO</td>
                <td>alex</td>
                <td>2026-03-12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
