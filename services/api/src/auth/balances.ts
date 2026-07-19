import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { isSolanaPublicKeyString } from '@armz-clash/blockchain';

export async function fetchWalletBalances(walletAddress: string): Promise<{
  network: 'solana-devnet';
  sol: { lamports: number; sol: number } | null;
  armz: { amount: string; decimals: number; configured: boolean } | null;
  rpcStatus: 'ok' | 'unavailable' | 'not_configured';
  queriedAt: string;
}> {
  const queriedAt = new Date().toISOString();
  if (!isSolanaPublicKeyString(walletAddress)) {
    throw Object.assign(new Error('Invalid wallet'), { statusCode: 400, code: 'invalid_wallet' });
  }

  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const mint = process.env.NEXT_PUBLIC_ARMZ_TOKEN_MINT?.trim() || '';

  try {
    const connection = new Connection(rpc, 'confirmed');
    const pubkey = new PublicKey(walletAddress);
    const lamports = await connection.getBalance(pubkey);
    let armz: { amount: string; decimals: number; configured: boolean } | null = null;

    if (!mint) {
      armz = { amount: '', decimals: 0, configured: false };
    } else {
      // SPL token balance via parsed token accounts by mint
      const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        mint: new PublicKey(mint),
      });
      const first = accounts.value[0];
      if (!first) {
        armz = { amount: '0', decimals: 0, configured: true };
      } else {
        const info = first.account.data.parsed.info.tokenAmount as {
          amount: string;
          decimals: number;
        };
        armz = { amount: info.amount, decimals: info.decimals, configured: true };
      }
    }

    return {
      network: 'solana-devnet',
      sol: { lamports, sol: lamports / LAMPORTS_PER_SOL },
      armz,
      rpcStatus: 'ok',
      queriedAt,
    };
  } catch {
    return {
      network: 'solana-devnet',
      sol: null,
      armz: mint
        ? { amount: '', decimals: 0, configured: true }
        : { amount: '', decimals: 0, configured: false },
      rpcStatus: 'unavailable',
      queriedAt,
    };
  }
}
