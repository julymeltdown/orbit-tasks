import { useCallback, useEffect, useState } from "react";
import { request } from "@/lib/http/client";
import type { ViewConfigurationContract } from "@/lib/http/contracts";

interface CreateInput {
  viewType: string;
  filters: Record<string, unknown>;
  sort?: Record<string, unknown>;
  ownerScope?: "USER" | "TEAM" | "PROJECT_DEFAULT";
}

export function useViewConfigurations(projectId: string) {
  const [configs, setConfigs] = useState<ViewConfigurationContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await request<ViewConfigurationContract[]>(`/api/projects/${projectId}/view-configurations`);
      setConfigs(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load view configurations");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function saveDefaultConfiguration(viewType: string, filters: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const saved = await request<ViewConfigurationContract>(`/api/projects/${projectId}/view-configurations`, {
        method: "POST",
        body: {
          viewType,
          filters,
          sort: {},
          ownerScope: "USER"
        }
      });
      setConfigs((prev) => {
        const withoutSame = prev.filter((item) => !(item.viewType === saved.viewType && item.ownerScope === saved.ownerScope));
        return [saved, ...withoutSame];
      });
      return saved;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save view configuration";
      setError(message);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function createConfiguration(input: CreateInput) {
    setSaving(true);
    setError(null);
    try {
      const saved = await request<ViewConfigurationContract>(`/api/projects/${projectId}/view-configurations`, {
        method: "POST",
        body: {
          viewType: input.viewType,
          filters: input.filters,
          sort: input.sort ?? {},
          ownerScope: input.ownerScope ?? "USER"
        }
      });
      setConfigs((prev) => [saved, ...prev.filter((item) => item.viewConfigId !== saved.viewConfigId)]);
      return saved;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create view configuration";
      setError(message);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return {
    configs,
    loading,
    saving,
    error,
    load,
    createConfiguration,
    saveDefaultConfiguration
  };
}

