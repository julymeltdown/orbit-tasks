interface Props {
  sprintName: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacitySp: number;
  dailyCapacityMinutes: number;
  loading: boolean;
  onChange: (patch: Partial<{
    sprintName: string;
    goal: string;
    startDate: string;
    endDate: string;
    capacitySp: number;
    dailyCapacityMinutes: number;
  }>) => void;
  onNext: () => void;
}

export function SprintWizardStepInfo({
  sprintName,
  goal,
  startDate,
  endDate,
  capacitySp,
  dailyCapacityMinutes,
  loading,
  onChange,
  onNext
}: Props) {
  return (
    <section className="orbit-sprint-step">
      <h3 style={{ margin: 0 }}>Step 1 · Sprint Info</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
        Define the sprint frame first. You can tune backlog/day plans in next steps.
      </p>
      <div className="orbit-sprint-form-grid">
        <label className="orbit-sprint-field">
          <span>Sprint name</span>
          <input
            className="orbit-input"
            value={sprintName}
            onChange={(event) => onChange({ sprintName: event.target.value })}
            placeholder="Sprint name"
          />
        </label>
        <label className="orbit-sprint-field">
          <span>Sprint goal</span>
          <input className="orbit-input" value={goal} onChange={(event) => onChange({ goal: event.target.value })} placeholder="Sprint goal" />
        </label>
        <label className="orbit-sprint-field">
          <span>Start date</span>
          <input className="orbit-input" type="date" value={startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
        </label>
        <label className="orbit-sprint-field">
          <span>End date</span>
          <input className="orbit-input" type="date" value={endDate} onChange={(event) => onChange({ endDate: event.target.value })} />
        </label>
        <label className="orbit-sprint-field">
          <span>Capacity (SP)</span>
          <input
            className="orbit-input"
            type="number"
            min={1}
            value={capacitySp}
            onChange={(event) => onChange({ capacitySp: Number(event.target.value) })}
            placeholder="Capacity SP"
          />
        </label>
        <label className="orbit-sprint-field">
          <span>Daily capacity (minutes)</span>
          <input
            className="orbit-input"
            type="number"
            min={30}
            value={dailyCapacityMinutes}
            onChange={(event) => onChange({ dailyCapacityMinutes: Number(event.target.value) })}
            placeholder="Daily capacity (minutes)"
          />
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="orbit-button" type="button" onClick={onNext} disabled={loading}>
          {loading ? "Creating..." : "Save & Continue"}
        </button>
      </div>
    </section>
  );
}
