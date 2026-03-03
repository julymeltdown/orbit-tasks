"use client";

import { useState } from "react";
import styles from "@/app/(afterLogin)/page.module.css";
import { adminApi } from "@/lib/api";

export default function AdminTelemetryPage() {
  const [telemetry, setTelemetry] = useState<string>("");
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const loadTelemetry = async () => {
    setTelemetryError(null);
    setTelemetry("");
    try {
      const response = await adminApi.telemetrySummary();
      setTelemetry(JSON.stringify(response, null, 2));
    } catch (err) {
      setTelemetryError(err instanceof Error ? err.message : "Telemetry failed.");
    }
  };

  return (
    <section className={styles.section}>
      <strong>Telemetry summary</strong>
      <button className={styles.button} type="button" onClick={loadTelemetry}>
        Fetch summary
      </button>
      {telemetryError && <div className={styles.error}>{telemetryError}</div>}
      {telemetry && <pre className={styles.output}>{telemetry}</pre>}
    </section>
  );
}
