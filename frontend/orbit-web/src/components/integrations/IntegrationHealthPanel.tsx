interface ConnectorHealth {
  provider: string;
  status: string;
  lastSyncAt: string;
  retryQueued: number;
}

interface Props {
  connectors: ConnectorHealth[];
}

export function IntegrationHealthPanel({ connectors }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Integration Health</h3>
      {connectors.map((connector) => (
        <div key={connector.provider} className="orbit-panel" style={{ padding: 10, display: "grid", gap: 4 }}>
          <strong>{connector.provider}</strong>
          <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
            {connector.status} · last sync {connector.lastSyncAt} · retry queue {connector.retryQueued}
          </div>
        </div>
      ))}
    </article>
  );
}
