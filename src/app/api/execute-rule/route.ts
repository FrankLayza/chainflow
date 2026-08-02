import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeTransfer, getExecutionStatus } from '@/lib/keeperhub/client';
import { DEFAULT_CHAIN_ID, NETWORK_LABEL, explorerUrl as txExplorerUrl } from '@/lib/keeperhub/config';
import { KeeperHubMCPClient } from '@/lib/keeperhub/mcp-client';
import { createAuditRecord, addAuditEvent, registerActiveRule, RecordStatus } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';
import { ParsedRule } from '@/types/rule';

function normalizeTransferResponse(raw: Record<string, unknown> | null) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rule, simulate } = body as { rule: ParsedRule; simulate?: boolean };

    if (!rule || !rule.parameters) {
      return NextResponse.json(
        { error: 'Valid rule with parameters is required' },
        { status: 400 }
      );
    }

    const { targetAddress, transferAmount } = rule.parameters;
    const idempotencyKey = crypto.randomUUID();
    const sessionId = await resolveSessionId();

    await registerActiveRule(rule, sessionId);

    if (simulate) {
      const khResponse = await executeTransfer(
        {
          chainId: DEFAULT_CHAIN_ID,
          recipientAddress: targetAddress,
          amount: transferAmount,
          simulate: true,
        },
        idempotencyKey
      );

      return NextResponse.json({
        success: true,
        status: 'SIMULATED',
        khResponse,
      });
    }

    let khResponse: Record<string, unknown> | null = null;
    let executionId: string | null = null;
    let txHash: string | null = null;
    let explorerUrl: string | null = null;
    let gasUsed: number | null = null;
    let sponsored: boolean | null = null;
    let usedMcp = true;

    try {
      const mcp = await KeeperHubMCPClient.connect();
      try {
        const result = await mcp.executeTransfer({
          chain_id: String(DEFAULT_CHAIN_ID),
          to_address: targetAddress,
          amount: transferAmount,
          idempotency_key: idempotencyKey,
        });
        const normalized = normalizeTransferResponse(result);
        executionId = normalized.executionId;
        txHash = normalized.transactionHash;
        explorerUrl = normalized.transactionLink;
        gasUsed = normalized.gasUsed;
        sponsored = normalized.sponsored;

        if (executionId && !txHash) {
          const status = await mcp.getExecutionStatus(executionId);
          const statusNormalized = normalizeTransferResponse(status);
          txHash = statusNormalized.transactionHash;
          explorerUrl = statusNormalized.transactionLink;
          gasUsed = statusNormalized.gasUsed;
          sponsored = statusNormalized.sponsored ?? sponsored;
          khResponse = status;
        } else {
          khResponse = result;
        }
      } finally {
        await mcp.close().catch(() => {});
      }
    } catch (mcpError: any) {
      console.warn('MCP execution failed, falling back to REST:', mcpError.message);
      usedMcp = false;

      const restResponse = await executeTransfer(
        {
          chainId: DEFAULT_CHAIN_ID,
          recipientAddress: targetAddress,
          amount: transferAmount,
        },
        idempotencyKey
      );

      executionId = restResponse.executionId || 'ext-' + Date.now();
      txHash = restResponse.transactionHash || restResponse.result?.transactionHash || null;
      explorerUrl = restResponse.transactionLink || restResponse.result?.transactionLink || null;
      gasUsed = restResponse.result?.gasUsed ?? null;
      sponsored = restResponse.result?.sponsored ?? null;
      khResponse = restResponse as unknown as Record<string, unknown>;

      if (executionId && (!txHash || restResponse.status === 'pending')) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const statusResponse = await getExecutionStatus(executionId);
          txHash = statusResponse.transactionHash || statusResponse.result?.transactionHash || null;
          explorerUrl = statusResponse.transactionLink || statusResponse.result?.transactionLink || null;
          gasUsed = statusResponse.result?.gasUsed ?? null;
          sponsored = statusResponse.result?.sponsored ?? sponsored;
          khResponse = statusResponse as unknown as Record<string, unknown>;
        } catch (pollErr) {
          console.warn('Initial status poll warning:', pollErr);
        }
      }
    }

    // A transaction hash is the only evidence that this reached the chain.
    // Without one the execution is submitted, not confirmed — claiming
    // CONFIRMED here would persist a row no explorer link can back up.
    const finalStatus: RecordStatus = txHash ? 'CONFIRMED' : 'PENDING';

    const record = await createAuditRecord({
      id: executionId || 'ext-' + Date.now(),
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      raw_input: rule.rawInput,
      parsed_rule_json: JSON.stringify(rule),
      network: rule.network || NETWORK_LABEL,
      keeperhub_execution_id: executionId || undefined,
      status: finalStatus,
      transaction_hash: txHash || undefined,
      explorer_url: explorerUrl || (txHash ? txExplorerUrl(DEFAULT_CHAIN_ID, txHash) : undefined),
      gas_used: gasUsed ? `${gasUsed} units` : undefined,
      sponsored: sponsored ?? true,
      recipient_address: targetAddress,
      amount: transferAmount,
      chain_id: DEFAULT_CHAIN_ID,
    });

    await addAuditEvent(
      record.id,
      finalStatus,
      `Execution ${usedMcp ? 'via KeeperHub MCP' : 'via KeeperHub REST (MCP fallback)'}. Tx: ${txHash || 'pending'}`
    );

    return NextResponse.json({
      success: true,
      executionId,
      record,
      viaMcp: usedMcp,
      khResponse,
    });
  } catch (error: any) {
    console.error('API /execute-rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
