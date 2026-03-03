"use client";

import { useState } from "react";
import styles from "@/app/(afterLogin)/page.module.css";
import { adminApi } from "@/lib/api";
import { parseJson } from "@/app/(afterLogin)/admin/_component/parseJson";

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<string>("");
  const [contractId, setContractId] = useState("");
  const [contractResult, setContractResult] = useState<string>("");
  const [contractCreateJson, setContractCreateJson] = useState(
    "{\n  \"routeKey\": \"feed-summary\",\n  \"owner\": \"sns-ui\",\n  \"slaTarget\": \"p95<200ms\",\n  \"status\": \"draft\"\n}"
  );
  const [contractVersions, setContractVersions] = useState<string>("");
  const [contractVersionCreateJson, setContractVersionCreateJson] = useState(
    "{\n  \"version\": \"v1\",\n  \"status\": \"active\"\n}"
  );
  const [contractVersion, setContractVersion] = useState("");
  const [contractVersionResult, setContractVersionResult] = useState<string>("");
  const [contractVersionUpdateJson, setContractVersionUpdateJson] = useState(
    "{\n  \"status\": \"deprecated\"\n}"
  );
  const [contractError, setContractError] = useState<string | null>(null);

  const loadContracts = async () => {
    setContractError(null);
    setContracts("");
    try {
      const response = await adminApi.contracts.list();
      setContracts(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Contracts failed.");
    }
  };

  const loadContract = async () => {
    setContractError(null);
    setContractResult("");
    try {
      const response = await adminApi.contracts.get(contractId);
      setContractResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Contract fetch failed.");
    }
  };

  const createContract = async () => {
    const payload = parseJson<Record<string, unknown>>(contractCreateJson, setContractError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.contracts.create(payload);
      setContractResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Contract create failed.");
    }
  };

  const loadVersions = async () => {
    setContractError(null);
    setContractVersions("");
    try {
      const response = await adminApi.contracts.versions(contractId);
      setContractVersions(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Version list failed.");
    }
  };

  const createVersion = async () => {
    const payload = parseJson<Record<string, unknown>>(contractVersionCreateJson, setContractError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.contracts.createVersion(contractId, payload);
      setContractVersionResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Version create failed.");
    }
  };

  const loadVersion = async () => {
    setContractError(null);
    setContractVersionResult("");
    try {
      const response = await adminApi.contracts.getVersion(contractId, contractVersion);
      setContractVersionResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Version fetch failed.");
    }
  };

  const updateVersion = async () => {
    const payload = parseJson<Record<string, unknown>>(contractVersionUpdateJson, setContractError);
    if (!payload) {
      return;
    }
    try {
      const response = await adminApi.contracts.updateVersion(contractId, contractVersion, payload);
      setContractVersionResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Version update failed.");
    }
  };

  return (
    <section className={styles.section}>
      <strong>Contracts</strong>
      <div className={styles.row}>
        <button className={styles.buttonSecondary} type="button" onClick={loadContracts}>
          List contracts
        </button>
        <input
          className={styles.input}
          placeholder="Contract ID"
          value={contractId}
          onChange={(event) => setContractId(event.target.value)}
        />
        <button className={styles.buttonSecondary} type="button" onClick={loadContract}>
          Get contract
        </button>
      </div>
      <label className={styles.field}>
        Create contract JSON
        <textarea
          className={styles.textarea}
          value={contractCreateJson}
          onChange={(event) => setContractCreateJson(event.target.value)}
        />
      </label>
      <button className={styles.button} type="button" onClick={createContract}>
        Create contract
      </button>
      <div className={styles.row}>
        <button className={styles.buttonSecondary} type="button" onClick={loadVersions}>
          List versions
        </button>
      </div>
      <label className={styles.field}>
        Create version JSON
        <textarea
          className={styles.textarea}
          value={contractVersionCreateJson}
          onChange={(event) => setContractVersionCreateJson(event.target.value)}
        />
      </label>
      <button className={styles.button} type="button" onClick={createVersion}>
        Create version
      </button>
      <label className={styles.field}>
        Version ID
        <input
          className={styles.input}
          value={contractVersion}
          onChange={(event) => setContractVersion(event.target.value)}
        />
      </label>
      <div className={styles.row}>
        <button className={styles.buttonSecondary} type="button" onClick={loadVersion}>
          Get version
        </button>
      </div>
      <label className={styles.field}>
        Update version JSON
        <textarea
          className={styles.textarea}
          value={contractVersionUpdateJson}
          onChange={(event) => setContractVersionUpdateJson(event.target.value)}
        />
      </label>
      <button className={styles.buttonSecondary} type="button" onClick={updateVersion}>
        Update version
      </button>
      {contractError && <div className={styles.error}>{contractError}</div>}
      {contracts && <pre className={styles.output}>{contracts}</pre>}
      {contractResult && <pre className={styles.output}>{contractResult}</pre>}
      {contractVersions && <pre className={styles.output}>{contractVersions}</pre>}
      {contractVersionResult && <pre className={styles.output}>{contractVersionResult}</pre>}
    </section>
  );
}
