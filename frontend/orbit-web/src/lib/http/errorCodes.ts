export const API_ERROR_MESSAGES: Record<string, string> = {
  DEPENDENCY_CYCLE: "This dependency creates a cycle. Adjust upstream/downstream links.",
  LOW_CONFIDENCE: "AI confidence is low. Review and edit the suggestion before applying.",
  CONFIRMATION_REQUIRED: "Select at least one approved suggestion before apply.",
  INVALID_SCOPE: "The requested resource is outside your current workspace scope.",
  NO_ACTIVE_SPRINT: "No active sprint found. Create or select a sprint first."
};

export function resolveApiErrorMessage(code: string | null | undefined, fallback: string): string {
  if (!code) {
    return fallback;
  }
  return API_ERROR_MESSAGES[code] ?? fallback;
}
