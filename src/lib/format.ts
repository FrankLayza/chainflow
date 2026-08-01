export type ReceiptTone = "confirmed" | "pending" | "failed" | "live" | "neutral";

/**
 * Truncate an EVM address to `0x1234…cdef`. Returns an em dash for missing or
 * too-short values rather than producing a misleading `"..."` from `slice`.
 */
export function truncateAddress(
  address: string | null | undefined,
  lead = 6,
  tail = 4,
): string {
  if (!address) return "—";
  const trimmed = address.trim();
  if (trimmed.length <= lead + tail + 1) return trimmed;
  return `${trimmed.slice(0, lead)}…${trimmed.slice(-tail)}`;
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${time} · ${day}`;
}

/**
 * Gas is only ever shown as a number KeeperHub actually reported. When it
 * reports nothing we say who covered the cost instead of inventing a figure —
 * the previous fallback was a hardcoded "77,119 units" presented as real.
 */
export function formatGas(
  gasUsed: string | number | null | undefined,
  sponsored = true,
): { value: string; isRealNumber: boolean } {
  if (gasUsed === null || gasUsed === undefined || gasUsed === "") {
    return {
      value: sponsored ? "Sponsored by KeeperHub" : "Not reported",
      isRealNumber: false,
    };
  }

  if (typeof gasUsed === "number") {
    return { value: `${gasUsed.toLocaleString()} units`, isRealNumber: true };
  }

  const numeric = Number(gasUsed.replace(/[,\s]|units/gi, ""));
  if (Number.isFinite(numeric) && numeric > 0) {
    return { value: `${numeric.toLocaleString()} units`, isRealNumber: true };
  }
  return { value: gasUsed, isRealNumber: false };
}

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
  const normalized = (status ?? "").trim().toUpperCase();

  if (normalized === "FAILED" || normalized === "REVERTED") {
    return { tone: "failed", label: "Failed" };
  }

  if (txHash) {
    if (normalized === "CONFIRMED" || normalized === "COMPLETED") {
      return { tone: "confirmed", label: "Confirmed" };
    }
    return { tone: "pending", label: normalized ? toTitle(normalized) : "Submitted" };
  }

  if (normalized === "CONFIRMED" || normalized === "COMPLETED") {
    return { tone: "pending", label: "Submitted — awaiting hash" };
  }
  if (normalized === "EXECUTING" || normalized === "PENDING" || normalized === "RETRYING") {
    return { tone: "pending", label: toTitle(normalized) };
  }
  if (!normalized) return { tone: "neutral", label: "Unknown" };

  return { tone: "neutral", label: toTitle(normalized) };
}

function toTitle(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
