import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ActivationStep } from "@/features/activation/types";

interface Props {
  checklist: ActivationStep[];
}

function stepIcon(status: ActivationStep["status"]) {
  if (status === "DONE") return "check_circle";
  if (status === "LOCKED") return "lock";
  if (status === "SKIPPED") return "skip_next";
  return "radio_button_unchecked";
}

export function ActivationChecklist({ checklist }: Props) {
  const navigate = useNavigate();
  const progress = useMemo(() => {
    if (checklist.length === 0) {
      return 0;
    }
    const done = checklist.filter((step) => step.status === "DONE").length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  return (
    <article className="orbit-card orbit-activation-checklist">
      <header className="orbit-activation-checklist__head">
        <div>
          <p className="orbit-ops-hub__eyebrow">Getting Started</p>
          <h3 style={{ margin: "2px 0 0 0" }}>Activation Checklist</h3>
        </div>
        <strong>{progress}%</strong>
      </header>

      <ol className="orbit-activation-checklist__list">
        {checklist.map((step) => (
          <li key={step.stepCode} className="orbit-activation-checklist__item">
            <span className="material-symbols-outlined">{stepIcon(step.status)}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <div className="orbit-activation-checklist__actions">
                <button
                  className="orbit-link-button orbit-link-button--tab"
                  type="button"
                  disabled={step.status === "LOCKED"}
                  onClick={() => navigate(step.primaryAction.path)}
                >
                  {step.primaryAction.label}
                </button>
                {(step.secondaryActions ?? []).slice(0, 1).map((action) => (
                  <button
                    key={action.path}
                    className="orbit-link-button orbit-link-button--tab"
                    type="button"
                    disabled={step.status === "LOCKED"}
                    onClick={() => navigate(action.path)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

