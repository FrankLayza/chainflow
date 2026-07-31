import { NextResponse } from 'next/server';
import { listAllRules, listAuditRecords } from '@/repositories/audit-repository';

export async function GET() {
  try {
    const rawRules = listAllRules();
    const rawExecutions = listAuditRecords();

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
      chainId: e.chain_id || 11155111,
      errorMessage: e.error_message_safe,
    }));

    return NextResponse.json({
      success: true,
      rules,
      executions,
      wallet: {
        address: process.env.keeperhub_wallet_address || '0xcafa5cb62968a28087171f2c3c4e9bcc6b18d221',
        network: 'Ethereum Sepolia (Chain ID 11155111)',
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
