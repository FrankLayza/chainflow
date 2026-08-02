export interface TransferRequest {
  chainId?: number;
  recipientAddress: string;
  amount: string;
  simulate?: boolean;
}

export interface KeeperHubExecutionResponse {
  success?: boolean;
  executionId?: string;
  status: string;
  transactionHash?: string;
  transactionLink?: string;
  from?: string;
  to?: string;
  value?: string;
  gasEstimate?: number;
  wouldRevert?: boolean;
  result?: {
    gasUsed?: number;
    success?: boolean;
    sponsored?: boolean;
    transactionHash?: string;
    transactionLink?: string;
  };
  error?: string;
}

import { DEFAULT_CHAIN_ID } from './config';

const KEEPERHUB_BASE_URL = 'https://app.keeperhub.com/api';

function getApiKey(): string {
  const key = process.env.KEEPERHUB_API_KEY || process.env.keeperhub_API_KEY || '';
  if (!key) {
    console.warn('Warning: KEEPERHUB_API_KEY is missing from environment variables');
  }
  return key;
}

/**
 * Execute or simulate a direct transfer via KeeperHub Direct Execution API
 */
export async function executeTransfer(
  params: TransferRequest,
  idempotencyKey?: string
): Promise<KeeperHubExecutionResponse> {
  const apiKey = getApiKey();
  const chainId = params.chainId || DEFAULT_CHAIN_ID;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (idempotencyKey && !params.simulate) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${KEEPERHUB_BASE_URL}/execute/transfer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chainId,
      recipientAddress: params.recipientAddress,
      amount: params.amount,
      simulate: params.simulate || false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KeeperHub API HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Query the status of an execution by ID
 */
export async function getExecutionStatus(
  executionId: string
): Promise<KeeperHubExecutionResponse> {
  const apiKey = getApiKey();

  const response = await fetch(`${KEEPERHUB_BASE_URL}/execute/${executionId}/status`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KeeperHub Status API HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}
