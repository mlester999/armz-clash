import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { isSolanaPublicKeyString } from '../validators';

export type SignatureEncoding = 'base58' | 'base64';

export function decodeSignature(
  signature: string,
  encoding: SignatureEncoding = 'base58',
): Uint8Array {
  if (encoding === 'base64') {
    return new Uint8Array(Buffer.from(signature, 'base64'));
  }
  return bs58.decode(signature);
}

/**
 * Server-side Ed25519 verification of a Solana wallet message signature.
 * Message must be the exact UTF-8 bytes the server issued.
 */
export function verifySolanaMessageSignature(input: {
  message: string;
  signature: string;
  walletAddress: string;
  signatureEncoding?: SignatureEncoding;
}): { ok: true } | { ok: false; reason: string } {
  if (!isSolanaPublicKeyString(input.walletAddress)) {
    return { ok: false, reason: 'invalid_wallet_address' };
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(input.walletAddress);
  } catch {
    return { ok: false, reason: 'invalid_wallet_address' };
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeSignature(input.signature, input.signatureEncoding ?? 'base58');
  } catch {
    return { ok: false, reason: 'invalid_signature_encoding' };
  }

  if (signatureBytes.length !== 64) {
    return { ok: false, reason: 'invalid_signature_length' };
  }

  const messageBytes = new TextEncoder().encode(input.message);
  const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

  if (!verified) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  return { ok: true };
}
