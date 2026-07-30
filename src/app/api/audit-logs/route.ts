import { NextResponse } from 'next/server';
import { getActiveRules, getExecutionRecords } from '@/lib/store';

export async function GET() {
  try {
    const rules = getActiveRules();
    const executions = getExecutionRecords();

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
