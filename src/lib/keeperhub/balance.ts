import { KeeperHubMCPClient, getWalletIntegrationId } from '@/lib/keeperhub/mcp-client';

/**
 * Balance guard for on-chain transfers. Reads the demo wallet's ETH balance via
 * eth_getBalance so callers can refuse a broadcast when the transfer amount
 * exceeds what the wallet holds. The RPC endpoint comes from SEPOLIA_RPC_URL
 * (never hardcoded); without one configured the guard is disabled rather than
 * blocking execution.
 */

const WALLET_ADDRESS =
  process.env.KEEPERHUB_WALLET_ADDRESS ||
  process.env.NEXT_PUBLIC_KEEPERHUB_WALLET ||
  process.env.keeperhub_wallet_address ||
  '';

const RPC_URL = process.env.SEPOLIA_RPC_URL || '';

async function resolveSenderAddress(): Promise<string | null> {
  if (WALLET_ADDRESS) return WALLET_ADDRESS;
  try {
    const mcp = await KeeperHubMCPClient.connect();
    try {
      const wallet = await mcp.getWalletIntegration(getWalletIntegrationId());
      const address = wallet?.walletAddress || (wallet?.address as string | undefined);
      return address || null;
    } finally {
      await mcp.close().catch(() => {});
    }
  } catch (error: any) {
    console.warn('Could not resolve sender wallet address:', error?.message);
    return null;
  }
}

export async function getEthBalance(address?: string): Promise<number | null> {
  if (!RPC_URL) {
    console.warn('SEPOLIA_RPC_URL is not configured; balance guard disabled.');
    return null;
  }
  const target = address || (await resolveSenderAddress());
  if (!target) return null;

  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [target, 'latest'],
        id: 1,
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { result?: string; error?: { message?: string } };
    if (!data.result) {
      console.warn('eth_getBalance error:', data.error?.message || 'no result');
      return null;
    }
    return Number(BigInt(data.result)) / 1e18;
  } catch (error: any) {
    console.warn('Balance RPC call failed:', error?.message);
    return null;
  }
}

export interface BalanceGuardResult {
  ok: boolean;
  address: string | null;
  balance: number | null;
  reason?: string;
}

/**
 * Fail-open by design: an unverifiable balance (no RPC configured, lookup
 * failure) does not block execution — the guard only refuses when a balance is
 * actually read and found to be below the requested amount.
 */
export async function checkSufficientBalance(
  amountEth: string | number,
): Promise<BalanceGuardResult> {
  const amount = Number(amountEth);
  const address = await resolveSenderAddress();
  const balance = await getEthBalance(address ?? undefined);

  if (balance === null) {
    return { ok: true, address, balance: null };
  }

  const ok = Number.isFinite(amount) && balance >= amount;
  return {
    ok,
    address,
    balance,
    reason: ok
      ? undefined
      : `Balance insufficient to execute — wallet holds ${balance} ETH, transfer needs ${amount} ETH.`,
  };
}
