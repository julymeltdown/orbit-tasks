interface Props {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function MigrationValidationReport({ valid, errors, warnings }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0 }}>Validation Report</h3>
      <strong style={{ color: valid ? "var(--orbit-success)" : "var(--orbit-danger)" }}>
        {valid ? "VALID" : "INVALID"}
      </strong>
      {errors.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--orbit-danger)", fontSize: 13 }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {warnings.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#d19a00", fontSize: 13 }}>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
