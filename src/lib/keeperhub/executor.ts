import { executeTransfer as restExecute, getExecutionStatus as restGetStatus } from '@/lib/keeperhub/client';
import { KeeperHubMCPClient } from '@/lib/keeperhub/mcp-client';

/**
 * The broadcast seam. Two adapters sit at it — MCP (primary) and REST
 * (fallback) — both feeding this shape. `broadcastTransfer` orchestration,
 * audit persistence, and terminal marking live behind the seam and never touch
 * a concrete KeeperHub transport.
 */
export interface ExecutorResult {
  executionId: string | null;
  status: string;
  transactionHash: string | null;
  transactionLink: string | null;
  gasUsed: number | null;
  sponsored: boolean | null;
}

export interface TransferExecutor {
  executeTransfer(params: {
    chainId: number;
    targetAddress: string;
    amount: string;
    idempotencyKey?: string;
  }): Promise<ExecutorResult>;
  getExecutionStatus(executionId: string): Promise<ExecutorResult>;
}

/** One normalizer for both adapters, so a consumer sees one shape. */
export function normalizeTransferResponse(raw: Record<string, unknown> | null): ExecutorResult {
  const result = raw?.result as Record<string, unknown> | undefined;
  return {
    executionId: (raw?.executionId as string) || (raw?.id as string) || null,
    status: (raw?.status as string) || 'pending',
    transactionHash: (raw?.transactionHash as string) || (raw?.txHash as string) || null,
    transactionLink: (raw?.transactionLink as string) || (raw?.explorerUrl as string) || null,
    gasUsed: (raw?.gasUsed as number) || (result?.gasUsed as number) || null,
    sponsored:
      raw?.sponsored != null
        ? Boolean(raw?.sponsored)
        : result?.sponsored != null
          ? Boolean(result?.sponsored)
          : null,
  };
}

export class McpExecutor implements TransferExecutor {
  async executeTransfer(params: {
    chainId: number;
    targetAddress: string;
    amount: string;
    idempotencyKey?: string;
  }): Promise<ExecutorResult> {
    const mcp = await KeeperHubMCPClient.connect();
    try {
      const result = await mcp.executeTransfer({
        chain_id: String(params.chainId),
        to_address: params.targetAddress,
        amount: params.amount,
        idempotency_key: params.idempotencyKey,
      });
      return normalizeTransferResponse(result);
    } finally {
      await mcp.close().catch(() => {});
    }
  }

  async getExecutionStatus(executionId: string): Promise<ExecutorResult> {
    const mcp = await KeeperHubMCPClient.connect();
    try {
      return normalizeTransferResponse(await mcp.getExecutionStatus(executionId));
    } finally {
      await mcp.close().catch(() => {});
    }
  }
}

export class RestExecutor implements TransferExecutor {
  async executeTransfer(params: {
    chainId: number;
    targetAddress: string;
    amount: string;
    idempotencyKey?: string;
  }): Promise<ExecutorResult> {
    const raw = (await restExecute(
      {
        chainId: params.chainId,
        recipientAddress: params.targetAddress,
        amount: params.amount,
      },
      params.idempotencyKey
    )) as unknown as Record<string, unknown>;

    let result = normalizeTransferResponse(raw);
    if (result.executionId && (!result.transactionHash || result.status === 'pending')) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      result = await this.getExecutionStatus(result.executionId);
    }
    return result;
  }

  async getExecutionStatus(executionId: string): Promise<ExecutorResult> {
    const raw = (await restGetStatus(executionId)) as unknown as Record<string, unknown>;
    return normalizeTransferResponse(raw);
  }
}