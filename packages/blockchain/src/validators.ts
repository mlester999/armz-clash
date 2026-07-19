const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function isSolanaPublicKeyString(value: string): boolean {
  if (value.length < 32 || value.length > 44) return false;
  return BASE58_RE.test(value);
}

export function isSolanaSignatureString(value: string): boolean {
  // Signatures are base58 and typically 87–88 chars; allow a safe range.
  if (value.length < 64 || value.length > 128) return false;
  return BASE58_RE.test(value);
}

export type TokenDecimals = number;

export function isValidTokenDecimals(value: number): value is TokenDecimals {
  return Number.isInteger(value) && value >= 0 && value <= 18;
}
