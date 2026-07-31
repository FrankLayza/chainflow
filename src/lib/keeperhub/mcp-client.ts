import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

const MCP_ENDPOINT = process.env.KEEPERHUB_MCP_ENDPOINT || 'https://app.keeperhub.com/mcp';

export interface TransferArgs {
  chain_id: string;
  to_address: string;
  amount: string;
  token_address?: string;
  idempotency_key?: string;
}

export interface KeeperHubWallet {
  id: string;
  name?: string;
  walletAddress?: string;
  [key: string]: unknown;
}

interface MCPCallResult {
  content: { type: string; text?: string }[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

function getApiKey(): string {
  const key = process.env.KEEPERHUB_API_KEY || process.env.keeperhub_API_KEY || '';
  if (!key) {
    throw new Error('KEEPERHUB_API_KEY is missing from environment variables');
  }
  return key;
}

export function getWalletIntegrationId(): string {
  const id = process.env.KEEPERHUB_WALLET_INTEGRATION_ID;
  if (!id) {
    throw new Error('KEEPERHUB_WALLET_INTEGRATION_ID is missing from environment variables');
  }
  return id;
}

function resultText(result: MCPCallResult): string {
  const text = result.content.find((c) => c.type === 'text')?.text;
  return text ? text.trim() : '';
}

function parseJson<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export class KeeperHubMCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;

  private constructor(client: Client, transport: StreamableHTTPClientTransport) {
    this.client = client;
    this.transport = transport;
  }

  static async connect(): Promise<KeeperHubMCPClient> {
    const transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT), {
      requestInit: {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      },
    });
    const client = new Client({ name: 'chainflow', version: '1.0.0' });
    await client.connect(transport);
    return new KeeperHubMCPClient(client, transport);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const result = (await this.client.callTool({ name, arguments: args })) as MCPCallResult;
    if (result.isError) {
      throw new Error(resultText(result) || `KeeperHub MCP tool ${name} failed`);
    }
    return parseJson<Record<string, unknown>>(resultText(result));
  }

  async getWalletIntegration(integrationId: string = getWalletIntegrationId()): Promise<KeeperHubWallet | null> {
    return (await this.callTool('get_wallet_integration', { integrationId })) as KeeperHubWallet | null;
  }

  async executeTransfer(args: TransferArgs): Promise<Record<string, unknown> | null> {
    return this.callTool('execute_transfer', { ...args });
  }

  async getExecutionStatus(executionId: string): Promise<Record<string, unknown> | null> {
    return this.callTool('get_direct_execution_status', { execution_id: executionId });
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
