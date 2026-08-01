export const steps = [
  {
    number: "01",
    title: "Describe your rule",
    description:
      "Write what you want in plain English. ChainFlow parses your intent into a structured on-chain rule.",
    lines: [
      {
        prefix: ">",
        text: '"Send 0.1 ETH to vitalik.eth every Monday"',
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
        text: "Parsed: transfer · 0.1 ETH · vitalik.eth · weekly (Monday)",
        tone: "ok" as const,
      },
      {
        prefix: "✓",
        text: "Simulated: gas estimate 21,000 · testnet Sepolia",
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
        text: "Executed: 0x3a8f...7c2d · confirmed block #18,293,441",
        tone: "ok" as const,
      },
    ],
  },
];

export const toneClass = {
  input: { prefix: "text-gray-400", text: "text-white" },
  ok: { prefix: "text-violet-400", text: "text-gray-400" },
} as const;
