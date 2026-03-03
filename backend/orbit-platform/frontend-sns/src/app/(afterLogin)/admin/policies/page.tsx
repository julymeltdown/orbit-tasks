"use client";

import { useState } from "react";
import styles from "@/app/(afterLogin)/page.module.css";
import { adminApi } from "@/lib/api";
import { parseJson } from "@/app/(afterLogin)/admin/_component/parseJson";

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<string>("");
  const [policyId, setPolicyId] = useState("");
  const [policyResult, setPolicyResult] = useState<string>("");
  const [policyCreateJson, setPolicyCreateJson] = useState("{\n  \"name\": \"default\"\n}");
  const [policyUpdateId, setPolicyUpdateId] = useState("");
  const [policyUpdateJson, setPolicyUpdateJson] = useState("{\n  \"name\": \"updated\"\n}");
  const [policyError, setPolicyError] = useState<string | null>(null);

  const loadPolicies = async () => {
    setPolicyError(null);
    setPolicies("");
    try {
      const response = await adminApi.policies.list();
      setPolicies(JSON.stringify(response, null, 2));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : "Policies failed.");
    }
  };

  const loadPolicy = async () => {
    setPolicyError(null);
    setPolicyResult("");
    try {
      const response = await adminApi.policies.get(policyId);
      setPolicyResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : "Policy fetch failed.");
    }
  };

  const createPolicy = async () => {
    const payload = parseJson<Record<string, unknown>>(policyCreateJson, setPolicyError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.policies.create(payload);
      setPolicyResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : "Policy create failed.");
    }
  };

  const updatePolicy = async () => {
    const payload = parseJson<Record<string, unknown>>(policyUpdateJson, setPolicyError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.policies.update(policyUpdateId, payload);
      setPolicyResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : "Policy update failed.");
    }
  };

  return (
    <section className={styles.section}>
      <strong>Policies</strong>
      <div className={styles.row}>
        <button className={styles.buttonSecondary} type="button" onClick={loadPolicies}>
          List policies
        </button>
        <input
          className={styles.input}
          placeholder="Policy ID"
          value={policyId}
          onChange={(event) => setPolicyId(event.target.value)}
        />
        <button className={styles.buttonSecondary} type="button" onClick={loadPolicy}>
          Get policy
        </button>
      </div>
      <label className={styles.field}>
        Create policy JSON
        <textarea
          className={styles.textarea}
          value={policyCreateJson}
          onChange={(event) => setPolicyCreateJson(event.target.value)}
        />
      </label>
      <button className={styles.button} type="button" onClick={createPolicy}>
        Create policy
      </button>
      <label className={styles.field}>
        Update policy ID
        <input
          className={styles.input}
          value={policyUpdateId}
          onChange={(event) => setPolicyUpdateId(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        Update policy JSON
        <textarea
          className={styles.textarea}
          value={policyUpdateJson}
          onChange={(event) => setPolicyUpdateJson(event.target.value)}
        />
      </label>
      <button className={styles.buttonSecondary} type="button" onClick={updatePolicy}>
        Update policy
      </button>
      {policyError && <div className={styles.error}>{policyError}</div>}
      {policies && <pre className={styles.output}>{policies}</pre>}
      {policyResult && <pre className={styles.output}>{policyResult}</pre>}
    </section>
  );
}
