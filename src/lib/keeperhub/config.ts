/**
 * All KeeperHub + network configuration, read from environment in one place.
 * Everything else imports accessors from here instead of touching process.env,
 * so there is exactly one failure policy: required keys throw (loudly, at first
 * use), optional keys degrade to a documented default or null. Previously the
 * same key was read with different tolerances in client.ts (warn), mcp-client.ts
 * (throw), and balance.ts (fail-open), and the wallet address was resolved three
 * ways — one of which was missing a fallback the others had.
 */

const raw = (name: string): string | undefined => process.env[name];

function required(name: string, value: string | undefined): string {
  if (value) return value;
  throw new Error(`${name} is missing from the environment`);
}

/** Render a numeric env value, or a default when absent/NaN. */
function numberValue(name: string, fallback: number): number {
  const parsed = Number(raw(name));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** KeeperHub API key — required for any direct/mcp execution. */
export function getApiKey(): string {
  return required('KEEPERHUB_API_KEY', raw('KEEPERHUB_API_KEY') ?? raw('keeperhub_API_KEY'));
}

/** Wallet integration id registered with KeeperHub — required for wallet ops. */
export function getWalletIntegrationId(): string {
  return required('KEEPERHUB_WALLET_INTEGRATION_ID', raw('KEEPERHUB_WALLET_INTEGRATION_ID'));
}

/**
 * The demo wallet's address, resolved with all three legacy aliases so a
 * deploy that set only one still works.
 */
export function getWalletAddress(): string | null {
  return (
    raw('KEEPERHUB_WALLET_ADDRESS') ??
    raw('NEXT_PUBLIC_KEEPERHUB_WALLET') ??
    raw('keeperhub_wallet_address') ??
    null
  );
}

/** Optional. Empty string disables the balance guard rather than blocking. */
export function getRpcUrl(): string {
  return raw('SEPOLIA_RPC_URL') ?? '';
}

export function getMcpEndpoint(): string {
  return raw('KEEPERHUB_MCP_ENDPOINT') ?? 'https://app.keeperhub.com/mcp';
}

export function getRestBaseUrl(): string {
  return raw('KEEPERHUB_BASE_URL') ?? 'https://app.keeperhub.com/api';
}

export const DEFAULT_CHAIN_ID = numberValue('KEEPERHUB_CHAIN_ID', 11155111);

export const NETWORK_LABEL = 'Ethereum Sepolia';

export function explorerUrl(chainId: number, txHash: string): string {
  const base =
    chainId === 84532 ? 'https://sepolia.basescan.org/tx/' : 'https://sepolia.etherscan.io/tx/';
  return `${base}${txHash}`;
}