import {
  FlaskConical,
  Fuel,
  MousePointerClick,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { NETWORK_CHAIN_ID, NETWORK_LABEL } from "./steps";

/**
 * Every claim is falsifiable against the code — no "your funds are safe", which
 * asserts nothing checkable. Each `evidence` line names where in the system the
 * guarantee actually lives.
 */
export interface SafetyFact {
  Icon: LucideIcon;
  label: string;
  detail: string;
  evidence: string;
}

export const SAFETY_FACTS: SafetyFact[] = [
  {
    Icon: FlaskConical,
    label: "Testnet only",
    detail: `Every execution targets ${NETWORK_LABEL}. There is no mainnet code path to fall back to.`,
    evidence: `chain ${NETWORK_CHAIN_ID}`,
  },
  {
    Icon: Wallet,
    label: "No wallet connection",
    detail:
      "ChainFlow never asks you to connect a wallet or sign anything. Transfers run from a KeeperHub-managed account, server-side.",
    evidence: "no signature request",
  },
  {
    Icon: MousePointerClick,
    label: "Nothing runs unconfirmed",
    detail:
      "Each rule is simulated first, then waits behind a two-step confirmation that restates the amount before it broadcasts.",
    evidence: "simulate → confirm → broadcast",
  },
  {
    Icon: Receipt,
    label: "Proof, or it doesn't claim success",
    detail:
      "A receipt only reads confirmed when a transaction hash exists to back it. No hash, and it says awaiting hash instead.",
    evidence: "hash-gated status",
  },
  {
    Icon: Fuel,
    label: "Gas is sponsored",
    detail:
      "KeeperHub covers the gas for every execution. Nothing to fund, no balance to top up, no cost to you.",
    evidence: "sponsored by KeeperHub",
  },
];
