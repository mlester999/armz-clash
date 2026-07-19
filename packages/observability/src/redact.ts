const SENSITIVE_KEY_PATTERN =
  /(secret|private[_-]?key|seed|mnemonic|service[_-]?role|authorization|cookie|password|signer)/i;

/** Keys that look sensitive but are safe public product labels. */
const SAFE_KEY_ALLOWLIST = new Set([
  'tokenName',
  'tokenSymbol',
  'tokenDisplay',
  'token_name',
  'token_symbol',
  'gameToken',
  'game_token',
]);

export function isSensitiveKey(key: string): boolean {
  if (SAFE_KEY_ALLOWLIST.has(key)) return false;
  // Avoid over-redacting public game token display fields like tokenDisplay.
  if (/^token(?!.*(?:secret|key|password))/i.test(key) && !/service|private|sign/i.test(key)) {
    return false;
  }
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(String(index), item));
  }
  if (value && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = redactValue(key, value);
  }
  return output;
}
