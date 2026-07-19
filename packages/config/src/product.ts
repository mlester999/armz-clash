/**
 * Central product and token identity for Armz Clash.
 * Rename token ticker here — do not hardcode symbols across the UI.
 */

export const PRODUCT_NAME = 'Armz Clash' as const;
export const PRODUCT_DISPLAY_NAME = 'ARMZ CLASH' as const;
export const PRODUCT_TAGLINE = 'Premium Solana Arm-Wrestling Game' as const;
export const PRODUCT_SLUG = 'armz-clash' as const;

/** Temporary configurable game-token name (rename later without UI search/replace). */
export const TOKEN_NAME = 'Armz' as const;

/** Temporary configurable game-token ticker (without $). */
export const TOKEN_SYMBOL = 'ARMZ' as const;

/** Display format for UI, e.g. $ARMZ */
export function formatTokenSymbol(symbol: string = TOKEN_SYMBOL): string {
  const cleaned = symbol.replace(/^\$/, '').trim();
  return cleaned ? `$${cleaned}` : '$ARMZ';
}

export const DEFAULT_TOKEN_DISPLAY = formatTokenSymbol(TOKEN_SYMBOL);

export const DOCS_VERSION = '0.1.0-phase1' as const;
export const APP_PHASE = 1 as const;
export const APP_PHASE_LABEL = 'Phase 1 — Foundation' as const;
