/**
 * The demo recipient is the same funded test address the in-app presets use, so
 * every rule shown on the landing page actually parses and executes. ENS names
 * are deliberately absent: `ParsedRuleSchema` requires `/^0x[a-fA-F0-9]{40}$/`
 * and no resolver exists, so a `.eth` name here would advertise something the
 * product would reject.
 */
export const DEMO_RECIPIENT = "0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1";
export const DEMO_RECIPIENT_SHORT = "0xd210…A7A1";

export const NETWORK_LABEL = "Ethereum Sepolia";
export const NETWORK_CHAIN_ID = "11155111";

export const steps = [
  {
    number: "01",
    title: "Describe your rule",
    description:
      "Write what you want in plain English. ChainFlow parses your intent into a structured on-chain rule.",
    lines: [
      {
        prefix: ">",
        text: `"Send 0.01 ETH to ${DEMO_RECIPIENT_SHORT} every 24 hours"`,
        tone: "input" as const,
      },
    ],
  },
  {
    number: "02",
    title: "Review the interpretation",
    description:
      "See exactly what will happen — recipient, amount, network, trigger — before anything touches the chain.",
    lines: [
      {
        prefix: "✓",
        text: `Parsed: transfer · 0.01 ETH · ${DEMO_RECIPIENT_SHORT} · every 24h`,
        tone: "ok" as const,
      },
      {
        prefix: "✓",
        text: "Simulated: will not revert · gas sponsored",
        tone: "ok" as const,
      },
    ],
  },
  {
    number: "03",
    title: "Confirm and execute",
    description:
      "One click. KeeperHub executes the automation on testnet. You get a transaction hash and explorer link as proof.",
    lines: [
      {
        prefix: "✓",
        text: "Executed: 0x5b67…e471 · confirmed on Etherscan",
        tone: "ok" as const,
      },
    ],
  },
];

export const toneClass = {
  input: { prefix: "text-gray-400", text: "text-white" },
  ok: { prefix: "text-violet-400", text: "text-gray-400" },
} as const;
