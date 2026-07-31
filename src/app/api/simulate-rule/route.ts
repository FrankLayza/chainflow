import { NextResponse } from 'next/server';
import { executeTransfer } from '@/lib/keeperhub/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rule } = body as {
      rule?: { parameters?: { targetAddress?: string; transferAmount?: string } };
    };

    const targetAddress = rule?.parameters?.targetAddress;
    const transferAmount = rule?.parameters?.transferAmount;

    if (!targetAddress || !transferAmount) {
      return NextResponse.json(
        { error: 'Valid rule with targetAddress and transferAmount is required' },
        { status: 400 }
      );
    }

    const khResponse = await executeTransfer(
      {
        chainId: 11155111,
        recipientAddress: targetAddress,
        amount: transferAmount,
        simulate: true,
      },
      undefined
    );

    const wouldRevert = Boolean(khResponse.wouldRevert);
    const result = khResponse.result || {};

    return NextResponse.json({
      success: true,
      simulation: {
        status: 'SIMULATED',
        wouldRevert,
        passed: !wouldRevert,
        gasEstimate: khResponse.gasEstimate ?? result.gasUsed ?? null,
        gasEstimateUsd: null,
        from: khResponse.from || null,
        to: khResponse.to || targetAddress,
        amount: transferAmount,
        sponsored: true,
      },
    });
  } catch (error: any) {
    console.error('API /simulate-rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Simulation failed' },
      { status: 500 }
    );
  }
}
