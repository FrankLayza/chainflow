import { NextResponse } from 'next/server';
import { KeeperHubMCPClient } from '@/lib/keeperhub/mcp-client';

export async function GET() {
  let client: KeeperHubMCPClient | null = null;
  try {
    client = await KeeperHubMCPClient.connect();
    const wallet = await client.getWalletIntegration();

    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet integration found for this organization' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.walletAddress,
        name: wallet.name,
      },
    });
  } catch (error: any) {
    console.error('GET /api/wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallet integration' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}
