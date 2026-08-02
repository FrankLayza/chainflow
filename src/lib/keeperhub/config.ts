export const DEFAULT_CHAIN_ID = Number(process.env.KEEPERHUB_CHAIN_ID || '11155111');

export const NETWORK_LABEL = 'Ethereum Sepolia';

export function explorerUrl(chainId: number, txHash: string): string {
  const base =
    chainId === 84532 ? 'https://sepolia.basescan.org/tx/' : 'https://sepolia.etherscan.io/tx/';
  return `${base}${txHash}`;
}
