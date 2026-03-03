export function parseJson<T>(
  input: string,
  setError: (value: string | null) => void
): T | null {
  try {
    const payload = JSON.parse(input) as T;
    setError(null);
    return payload;
  } catch (err) {
    setError("Invalid JSON payload.");
    return null;
  }
}
