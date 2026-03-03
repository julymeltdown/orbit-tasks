const KEY = "orbit.intent.returnTo";

export function stashIntent(returnTo: string) {
  if (!returnTo) return;
  sessionStorage.setItem(KEY, returnTo);
}

export function consumeIntent(): string | null {
  const value = sessionStorage.getItem(KEY);
  if (!value) return null;
  sessionStorage.removeItem(KEY);
  return value;
}

export function resolveReturnTo(explicitReturnTo?: string | null, fallback = "/workspace/select") {
  if (explicitReturnTo && explicitReturnTo.startsWith("/")) {
    return explicitReturnTo;
  }
  const fromIntent = consumeIntent();
  if (fromIntent && fromIntent.startsWith("/")) {
    return fromIntent;
  }
  return fallback;
}
