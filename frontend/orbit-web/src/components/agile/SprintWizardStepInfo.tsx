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
      <div>
        <p className="orbit-ops-hub__eyebrow" style={{ marginBottom: 6 }}>Step 1</p>
        <h3 style={{ margin: 0 }}>Sprint 기본 정보</h3>
        <p style={{ margin: "6px 0 0", color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          이 단계에서는 기간, 목표, 용량만 정합니다. 복잡한 설정은 뒤로 미루고 먼저 실행 범위를 고정합니다.
        </p>
      </div>
      <div className="orbit-sprint-inline-note">
        <strong>다음 단계에서 할 일</strong>
        <p style={{ margin: 0 }}>Backlog를 고른 뒤 AI day plan draft를 생성합니다. 지금은 sprint 이름과 목표가 가장 중요합니다.</p>
      </div>
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
          {loading ? "생성 중..." : "저장 후 다음 단계"}
        </button>
      </div>
    </section>
  );
}
