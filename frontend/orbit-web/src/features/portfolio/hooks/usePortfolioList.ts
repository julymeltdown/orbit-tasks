import { useCallback, useEffect, useState } from "react";
import { request } from "@/lib/http/client";

export interface PortfolioItem {
  portfolioId: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  projectCount: number;
  updatedAt: string;
}

export function usePortfolioList(workspaceId: string | null | undefined) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await request<PortfolioItem[]>(`/api/portfolio/list?workspaceId=${encodeURIComponent(workspaceId)}`);
      setItems(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return {
    items,
    loading,
    error,
    load
  };
}

