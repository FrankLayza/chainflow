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

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Scheduled intervals are stored with either intervalHours or intervalMinutes
 * set (days are normalised to hours at parse time). Render whichever unit the
 * rule carries so "every 2 minutes" never displays as "0.033 hours".
 */
export function formatInterval(parameters: {
  intervalHours?: number | null;
  intervalMinutes?: number | null;
}): string {
  const minutes = parameters.intervalMinutes;
  const hours = parameters.intervalHours;
  if (minutes != null && Number.isFinite(minutes) && minutes > 0) {
    const value = Number.isInteger(minutes) ? minutes : minutes.toFixed(1);
    return `${value} min${minutes === 1 ? "" : "s"}`;
  }
  if (hours != null && Number.isFinite(hours) && hours > 0) {
    const value = Number.isInteger(hours) ? hours : hours.toFixed(1);
    return `${value} hr${hours === 1 ? "" : "s"}`;
  }
  return "N";
}