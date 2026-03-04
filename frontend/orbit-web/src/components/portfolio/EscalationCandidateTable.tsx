interface Candidate {
  projectId: string;
  projectName: string;
  riskScore: number;
  blockerCount: number;
  owner: string;
  recommendation: string;
}

interface Props {
  candidates: Candidate[];
}

export function EscalationCandidateTable({ candidates }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Escalation Candidates</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)" }}>
              <th>Project</th>
              <th>Risk</th>
              <th>Blockers</th>
              <th>Owner</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.projectId} style={{ borderBottom: "1px solid var(--orbit-border)" }}>
                <td>{candidate.projectName}</td>
                <td>{candidate.riskScore.toFixed(1)}</td>
                <td>{candidate.blockerCount}</td>
                <td>{candidate.owner}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>{candidate.recommendation}</span>
                    <a
                      className="orbit-link-button orbit-link-button--tab"
                      href={`/app/projects/timeline?project=${encodeURIComponent(candidate.projectId)}`}
                    >
                      Open
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
