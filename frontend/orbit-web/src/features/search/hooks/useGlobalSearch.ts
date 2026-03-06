import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";

export interface GlobalSearchResult {
  id: string;
  type: "WORK_ITEM" | "THREAD" | "DESTINATION";
  title: string;
  subtitle: string;
  path: string;
  icon: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResult[];
}

export function useGlobalSearch(workspaceId: string | null | undefined, projectId: string | null | undefined, query: string) {
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !projectId || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await request<GlobalSearchResponse>(
          `/api/v2/search?workspaceId=${encodeURIComponent(workspaceId)}&projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        setResults(response.results);
      } catch (nextError) {
        if ((nextError as Error).name !== "AbortError") {
          setError(nextError instanceof Error ? nextError.message : "검색 결과를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [projectId, query, workspaceId]);

  return { results, loading, error };
}
