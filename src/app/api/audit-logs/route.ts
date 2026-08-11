import { NextResponse } from 'next/server';
import {
  addAuditEvent,
  listAllRules,
  listAuditRecords,
  listPendingExecutions,
  updateAuditRecord,
} from '@/repositories/audit-repository';
import { getExecutionStatus } from '@/lib/keeperhub/client';
import { resolveSessionId } from '@/lib/session';
import {
  DEFAULT_CHAIN_ID,
  NETWORK_LABEL,
  explorerUrl as txExplorerUrl,
  getWalletAddress,
} from '@/lib/keeperhub/config';

async function reconcilePendingExecutions(sessionId: string): Promise<number> {
  const pending = await listPendingExecutions(sessionId);
  let reconciled = 0;

  for (const record of pending) {
    if (!record.keeperhub_execution_id) continue;
    try {
      const status = await getExecutionStatus(record.keeperhub_execution_id);
      const reported = status.status?.toLowerCase() ?? '';
      const txHash = status.transactionHash || status.result?.transactionHash || null;

      if (txHash) {
        await updateAuditRecord(record.id, {
          status: 'CONFIRMED',
          transaction_hash: txHash,
          explorer_url:
            status.transactionLink ||
            status.result?.transactionLink ||
            txExplorerUrl(record.chain_id || DEFAULT_CHAIN_ID, txHash),
          gas_used:
            status.result?.gasUsed != null ? `${status.result.gasUsed} units` : record.gas_used,
        });
        await addAuditEvent(record.id, 'CONFIRMED', `Reconciled: tx confirmed via status poll. Tx: ${txHash}`);
      } else if (
        reported.includes('fail') ||
        reported.includes('error') ||
        reported.includes('revert')
      ) {
        await updateAuditRecord(record.id, { status: 'FAILED' });
        await addAuditEvent(record.id, 'FAILED', 'Reconciled: execution failed on KeeperHub');
      } else {
        continue;
      }
      reconciled++;
    } catch (error: any) {
      console.warn('Reconcile status poll failed:', record.keeperhub_execution_id, error?.message);
    }
  }

  return reconciled;
}

export async function GET() {
  try {
    const sessionId = await resolveSessionId();
    const reconciled = await reconcilePendingExecutions(sessionId);
    const rawRules = await listAllRules(sessionId);
    const rawExecutions = await listAuditRecords(sessionId);

    const walletAddress = getWalletAddress();

    const rules = rawRules.map((r) => ({
      id: r.id,
      rawInput: r.raw_input,
      ruleType: r.rule_type,
      actionType: r.action_type,
      parameters: JSON.parse(r.parameters_json || '{}'),
      explanation: r.explanation,
      network: r.network,
      status: r.status,
      lastCheckedAt: r.last_checked_at,
      lastExecutedAt: r.last_executed_at,
      createdAt: r.created_at,
    }));

    const executions = rawExecutions.map((e) => ({
      id: e.id,
      rawInput: e.raw_input,
      timestamp: e.created_at,
      status: e.status,
      txHash: e.transaction_hash,
      explorerUrl: e.explorer_url,
      gasUsed: e.gas_used,
      sponsored: Boolean(e.sponsored),
      recipientAddress: e.recipient_address || '',
      amount: e.amount || '0',
      chainId: e.chain_id || DEFAULT_CHAIN_ID,
      errorMessage: e.error_message_safe,
    }));

    return NextResponse.json({
      success: true,
      reconciled,
      rules,
      executions,
      wallet: {
        address: walletAddress,
        network: `${NETWORK_LABEL} (Chain ID ${DEFAULT_CHAIN_ID})`,
        type: 'KeeperHub Turnkey EOA',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
