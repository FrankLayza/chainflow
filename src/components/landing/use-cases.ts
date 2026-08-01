import { DEMO_RECIPIENT, DEMO_RECIPIENT_SHORT } from "./steps";

/**
 * Every example here was checked against the deterministic parser in
 * `src/lib/ai/parser.ts`, which is the stricter of the two paths (the AI path is
 * schema-constrained and more forgiving). Each one matches the address regex,
 * hits the intended trigger branch, and yields a threshold.
 *
 * Deliberately excluded:
 *  - ENS names — `ParsedRuleSchema` demands `/^0x[a-fA-F0-9]{40}$/`, no resolver.
 *  - ERC-20s ("50 USDC") — `tokenSymbol` defaults to ETH; no token path exists.
 *  - Calendar phrasing ("every Sunday", "the 1st") — the scheduled branch only
 *    reads `([0-9]+)\s*(hours|days)` and would silently fall back to 24h.
 *  - "drops below" — matches the price branch first, so a balance rule phrased
 *    that way is misclassified as PRICE_BELOW.
 *  - Price rules — parseable, but no oracle exists to evaluate them.
 */
export interface UseCase {
  /** Full text sent to the parser, with the complete address. */
  prompt: string;
  /** Shown on the card, with the address truncated for readability. */
  display: string;
  trigger: string;
}

export const USE_CASES: UseCase[] = [
  {
    prompt: `Send 0.01 ETH to ${DEMO_RECIPIENT} every 24 hours`,
    display: `Send 0.01 ETH to ${DEMO_RECIPIENT_SHORT} every 24 hours`,
    trigger: "Scheduled",
  },
  {
    prompt: `Transfer 0.05 ETH to ${DEMO_RECIPIENT} every 7 days`,
    display: `Transfer 0.05 ETH to ${DEMO_RECIPIENT_SHORT} every 7 days`,
    trigger: "Scheduled",
  },
  {
    prompt: `Send 0.02 ETH to ${DEMO_RECIPIENT} when balance exceeds 1.5 ETH`,
    display: `Send 0.02 ETH to ${DEMO_RECIPIENT_SHORT} when balance exceeds 1.5 ETH`,
    trigger: "Balance",
  },
  {
    prompt: `Sweep 0.1 ETH to ${DEMO_RECIPIENT} when balance is above 2 ETH`,
    display: `Sweep 0.1 ETH to ${DEMO_RECIPIENT_SHORT} when balance is above 2 ETH`,
    trigger: "Balance",
  },
  {
    prompt: `Transfer 0.0001 ETH to ${DEMO_RECIPIENT} every 12 hours`,
    display: `Transfer 0.0001 ETH to ${DEMO_RECIPIENT_SHORT} every 12 hours`,
    trigger: "Scheduled",
  },
];
