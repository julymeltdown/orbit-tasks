const UUID_TOKEN_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export function maskUuidTokens(value: string): string {
  return value.replace(UUID_TOKEN_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

export function displayWorkItemTitle(rawTitle: string | null | undefined): string {
  const normalized = (rawTitle ?? "").trim();
  if (!normalized) {
    return "Untitled Task";
  }
  const masked = maskUuidTokens(normalized);
  return masked.length > 0 ? masked : "Untitled Task";
}
