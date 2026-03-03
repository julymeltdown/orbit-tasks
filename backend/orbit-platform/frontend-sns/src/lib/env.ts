const DEFAULT_API_BASE_URL = "https://tasksapi.infinitefallcult.trade";

export function resolveApiBase(configuredBase?: string, protocol?: string) {
  const trimmed = configuredBase?.trim();
  let resolved = trimmed && trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL;

  // Avoid mixed-content failures when an http base is configured by mistake.
  if (resolved.startsWith("http://") && protocol === "https:") {
    resolved = resolved.replace(/^http:\/\//, "https://");
  }

  return resolved;
}

const buildTimeBase = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE_URL);

export const env = {
  apiBaseUrl: resolveApiBase(
    buildTimeBase,
    typeof window === "undefined" ? undefined : window.location.protocol
  ),
};
