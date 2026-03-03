"use client";

import { useState } from "react";
import styles from "@/app/(afterLogin)/page.module.css";
import { adminApi } from "@/lib/api";
import { parseJson } from "@/app/(afterLogin)/admin/_component/parseJson";

export default function AdminRolloutsPage() {
  const [rolloutCreateJson, setRolloutCreateJson] = useState(
    "{\n  \"contractId\": \"contract-id\",\n  \"version\": \"v1\",\n  \"strategy\": \"immediate\",\n  \"percent\": 100\n}"
  );
  const [rolloutId, setRolloutId] = useState("");
  const [rolloutResult, setRolloutResult] = useState<string>("");
  const [rolloutError, setRolloutError] = useState<string | null>(null);

  const createRollout = async () => {
    const payload = parseJson<Record<string, unknown>>(rolloutCreateJson, setRolloutError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.rollouts.create(payload);
      setRolloutResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setRolloutError(err instanceof Error ? err.message : "Rollout create failed.");
    }
  };

  const loadRollout = async () => {
    setRolloutError(null);
    setRolloutResult("");
    try {
      const response = await adminApi.rollouts.get(rolloutId);
      setRolloutResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setRolloutError(err instanceof Error ? err.message : "Rollout fetch failed.");
    }
  };

  return (
    <section className={styles.section}>
      <strong>Rollouts</strong>
      <label className={styles.field}>
        Create rollout JSON
        <textarea
          className={styles.textarea}
          value={rolloutCreateJson}
          onChange={(event) => setRolloutCreateJson(event.target.value)}
        />
      </label>
      <button className={styles.button} type="button" onClick={createRollout}>
        Create rollout
      </button>
      <label className={styles.field}>
        Rollout ID
        <input
          className={styles.input}
          value={rolloutId}
          onChange={(event) => setRolloutId(event.target.value)}
        />
      </label>
      <button className={styles.buttonSecondary} type="button" onClick={loadRollout}>
        Get rollout
      </button>
      {rolloutError && <div className={styles.error}>{rolloutError}</div>}
      {rolloutResult && <pre className={styles.output}>{rolloutResult}</pre>}
    </section>
  );
}
