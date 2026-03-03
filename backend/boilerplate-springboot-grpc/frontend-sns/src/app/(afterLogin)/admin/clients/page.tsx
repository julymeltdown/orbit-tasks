"use client";

import { useState } from "react";
import styles from "@/app/(afterLogin)/page.module.css";
import { adminApi } from "@/lib/api";
import { parseJson } from "@/app/(afterLogin)/admin/_component/parseJson";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<string>("");
  const [clientId, setClientId] = useState("");
  const [clientResult, setClientResult] = useState<string>("");
  const [clientCreateJson, setClientCreateJson] = useState(
    "{\n  \"clientType\": \"web\",\n  \"allowedContracts\": [\"feed-summary\"],\n  \"policySetId\": \"default\"\n}"
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const loadClients = async () => {
    setClientError(null);
    setClients("");
    try {
      const response = await adminApi.clients.list();
      setClients(JSON.stringify(response, null, 2));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Clients failed.");
    }
  };

  const loadClient = async () => {
    setClientError(null);
    setClientResult("");
    try {
      const response = await adminApi.clients.get(clientId);
      setClientResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Client fetch failed.");
    }
  };

  const createClient = async () => {
    const payload = parseJson<Record<string, unknown>>(clientCreateJson, setClientError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.clients.create(payload);
      setClientResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Client create failed.");
    }
  };

  return (
    <section className={styles.section}>
      <strong>Client profiles</strong>
      <div className={styles.row}>
        <button className={styles.buttonSecondary} type="button" onClick={loadClients}>
          List clients
        </button>
        <input
          className={styles.input}
          placeholder="Client ID"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
        />
        <button className={styles.buttonSecondary} type="button" onClick={loadClient}>
          Get client
        </button>
      </div>
      <label className={styles.field}>
        Create client JSON
        <textarea
          className={styles.textarea}
          value={clientCreateJson}
          onChange={(event) => setClientCreateJson(event.target.value)}
        />
      </label>
      <button className={styles.button} type="button" onClick={createClient}>
        Create client
      </button>
      {clientError && <div className={styles.error}>{clientError}</div>}
      {clients && <pre className={styles.output}>{clients}</pre>}
      {clientResult && <pre className={styles.output}>{clientResult}</pre>}
    </section>
  );
}
