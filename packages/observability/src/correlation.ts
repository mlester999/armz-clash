export function createCorrelationId(prefix = 'armz'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}

export function extractCorrelationId(
  headers: Headers | Record<string, string | string[] | undefined>,
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get('x-request-id') ?? headers.get('x-correlation-id') ?? undefined;
  }
  const raw = headers['x-request-id'] ?? headers['x-correlation-id'];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
