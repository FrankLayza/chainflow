import type { ExecutionReceipt } from '@/types/rule';

/**
 * The one place receipt facts are assembled. A raw `/api/execute-rule` response
 * crosses this interface and becomes the UI-ready ExecutionReceipt — including
 * the "registered means armed, not sent" and "no hash means never claim
 * confirmation" rules — so the caller never re-derives receipt shape.
 */
export interface ExecuteRuleResponse {
  executionId?: string;
  registered?: boolean;
  message?: string;
  status?: string;
  viaMcp?: boolean;
  record?: {
    status?: string;
    transaction_hash?: string;
    explorer_url?: string;
    gas_used?: string;
  };
  khResponse?: Record<string, unknown>;
}

export function toReceipt(raw: ExecuteRuleResponse): ExecutionReceipt {
  return {
    executionId: raw.executionId ?? undefined,
    status: raw.registered
      ? 'REGISTERED'
      : raw.record?.status || raw.status || 'UNKNOWN',
    registered: Boolean(raw.registered),
    message: raw.message,
    txHash: raw.record?.transaction_hash ?? (raw.khResponse?.transactionHash as string | undefined),
    explorerUrl: raw.record?.explorer_url ?? (raw.khResponse?.transactionLink as string | undefined),
    gasUsed: raw.record?.gas_used,
    viaMcp: Boolean(raw.viaMcp),
  };
}

export type ReceiptTone = 'confirmed' | 'pending' | 'failed' | 'live' | 'neutral';

/**
 * A receipt may only claim confirmation when there is a transaction hash to
 * back it. The execute route persists a status string, but a status alone is
 * not evidence — without a hash there is nothing a judge can verify, so we
 * degrade to "pending" no matter what the row says.
 */
export function deriveReceiptStatus(
  status: string | null | undefined,
  txHash: string | null | undefined,
): { tone: ReceiptTone; label: string } {
  const normalized = (status ?? '').trim().toUpperCase();

  if (normalized === 'FAILED' || normalized === 'REVERTED') {
    return { tone: 'failed', label: 'Failed' };
  }

  if (txHash) {
    if (normalized === 'CONFIRMED' || normalized === 'COMPLETED') {
      return { tone: 'confirmed', label: 'Confirmed' };
    }
    return { tone: 'pending', label: normalized ? toTitle(normalized) : 'Submitted' };
  }

  if (normalized === 'CONFIRMED' || normalized === 'COMPLETED') {
    return { tone: 'pending', label: 'Submitted — awaiting hash' };
  }
  if (normalized === 'EXECUTING' || normalized === 'PENDING' || normalized === 'RETRYING') {
    return { tone: 'pending', label: toTitle(normalized) };
  }
  if (!normalized) return { tone: 'neutral', label: 'Unknown' };

  return { tone: 'neutral', label: toTitle(normalized) };
}

function toTitle(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}