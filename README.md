# ChainFlow

**An AI agent that turns plain English into on-chain rules — and executes them through [KeeperHub](https://app.keeperhub.com).**

Built for the [KeeperHub · Agents Onchain Hackathon](https://dorahacks.io/hackathon/agents-onchain/detail) (DoraHacks, deadline Aug 13, 2026).

ChainFlow solves the "last mile" of agent execution: an agent can decide *what* to do, but moving value onchain reliably is the hard part. ChainFlow is that execution and reliability layer — a chat UI that parses natural-language instructions into typed, validated rules, simulates them, asks for explicit human confirmation, and then executes real testnet transfers through KeeperHub. No wallet signing, no raw transaction code, no failed gas estimates.

## Features

- **Four trigger types, end to end:**
  - **Manual transfer** — "Transfer 0.001 ETH to 0xd210…7A1"
  - **Recurring transfer** — "…every 2 minutes", evaluated by a pull-based cron job
  - **Price alert transfer** — "If ETH drops below $2,400…", checked against CoinGecko on each cron tick
  - **Balance trigger transfer** — "…when balance exceeds 2 ETH", checked with `eth_getBalance` on each cron tick
- **Safety first** — every rule is parsed to a typed schema, simulated, and reviewed in a card before anything can broadcast. **Nothing broadcasts until you confirm.** Rules can be cancelled before arming and disabled after.
- **Audit log** — every execution is recorded with trigger, simulation, gas, status, and transaction hash, with a pull-to-refresh Activity tab.
- **Execution receipts** — a confirmed KeeperHub transaction posts a receipt card straight into the chat thread.
- **Message rail** — a scrollable preview rail lets you jump between messages in long threads (motion-reduced aware).
- **Server-side secrets** — API keys never reach the browser. The app runs one controlled testnet demo wallet; it never touches a visitor's wallet.

## Demo

The live app is deployed to Vercel. The seeded demo wallet is funded on **Ethereum Sepolia**, and every broadcast runs through KeeperHub with sponsored gas.

Try it: open the app, click a preset or type a prompt, review the parsed card, hit **Simulate** → **Confirm** → **Broadcast**, and watch the receipt land in the chat.

A verified on-chain execution produced by this project:

- **Rule:** send 0.001 ETH every 2 minutes
- **Tx:** `0xc4309612679018fb1ad6335941fffb7bdd4a5bc23242d784c8d50a45c26e4aba` — **confirmed**, gas sponsored
- **Recipient:** `0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1`

## How it works

```text
Browser (chat UI)
  ↓  POST /api/parse-rule
LLM parser → typed ParsedRule (Zod-validated)
  ↓  POST /api/simulate-rule
Simulation review card → human confirmation
  ↓  POST /api/execute-rule
KeeperHub direct-execution adapter (server-side only)
  ↓  Testnet transfer, gas sponsored
Receipt + tx hash → chat + Activity audit log
  ↓
GET /api/cron/check-rules   (cron-job.org ping)
  → evaluates scheduled / price / balance rules
  → fires matching broadcasts through KeeperHub
```

Cron is **pull-based**: nothing self-triggers. `GET /api/cron/check-rules` evaluates armed rules only when pinged by an external scheduler (cron-job.org, QStash, Vercel Cron, …) using `?token=<CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.

## Project structure

```text
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── app/page.tsx          # Product: chat + Activity + top bar
│   ├── audit/page.tsx        # Standalone audit view
│   └── api/
│       ├── parse-rule/       # NL → ParsedRule
│       ├── simulate-rule/    # Safe simulation
│       ├── execute-rule/     # KeeperHub broadcast
│       ├── rules/            # activate / disable / enable
│       ├── audit-logs/       # Activity feed
│       ├── wallet/           # Demo wallet info
│       └── cron/check-rules/ # Pull-based rule evaluator
├── components/
│   ├── agents/               # message-scroller
│   ├── chat/                 # ChatPanel, ParsedRuleCard, receipts, presets
│   ├── dashboard/            # AuditDashboard (pull-to-refresh)
│   ├── godui/                # gooey-stack
│   ├── motion/               # preview-rail, pull-to-refresh
│   ├── landing/              # Marketing sections
│   └── ui/                   # FieldGrid, StatusBadge, …
├── lib/
│   ├── ai/                   # Parser adapter + presets
│   ├── keeperhub/            # KeeperHub client + mapper
│   ├── db/                   # Turso/SQLite repository
│   └── …                     # env, ease, utils, hooks
└── types/rule.ts             # Domain types
```

Design and decision records live in [`CHAINFLOW-DOCS/`](CHAINFLOW-DOCS/): the challenge brief, architecture, known issues, and project progress.

## Getting started

Requirements: Node.js ≥ 22, pnpm ≥ 10.

```bash
pnpm install
cp .env.example .env.local   # fill in values, never commit this file
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for the full annotated list. The important ones:

| Variable | Purpose |
|---|---|
| `KEEPERHUB_API_KEY` | API key from app.keeperhub.com (grants the org's Turnkey wallet) |
| `KEEPERHUB_WALLET_INTEGRATION_ID` | Wallet integration id |
| `KEEPERHUB_WALLET_ADDRESS` | Demo wallet address (display only) |
| `KEEPERHUB_CHAIN_ID` | Defaults to Ethereum Sepolia (`11155111`) |
| `KEEPERHUB_MCP_ENDPOINT` | Defaults to `https://app.keeperhub.com/mcp` |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso DB; unset locally → `file:src/data/chainflow.db` |
| `SESSION_SECRET` | Signs the session cookie (required in production) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | AI parser provider key |
| `CRON_SECRET` | Shared secret guarding `/api/cron/check-rules` |
| `COINGECKO_API_KEY` | Optional; free CoinGecko endpoint works rate-limited |
| `SEPOLIA_RPC_URL` | Optional; enables the balance guard |

### Running the cron evaluator locally

```bash
curl "http://localhost:3000/api/cron/check-rules?token=$CRON_SECRET"
```

Each tick evaluates armed rules (every 2 minutes locally when you hit it repeatedly) and fires any that match — watch the Activity tab.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript type check |
| `pnpm db:check` | Verify DB schema/migrations |
| `pnpm db:migrate` | Apply migrations |

## Deployment

The app deploys to Vercel as a normal Next.js project. Set all environment variables in the Vercel dashboard (the filesystem is read-only, so `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` and `SESSION_SECRET` are required).

Then point a scheduler at the cron route so scheduled, price, and balance rules actually fire:

1. Create a cron-job.org job.
2. URL: `https://<your-app>.vercel.app/api/cron/check-rules?token=<CRON_SECRET>`
3. Schedule it to run every minute (or as tight as you need — the evaluator decides whether anything fires).

> **Warning:** a recurring rule that is still active will fire on every tick. Disable it in the Activity tab when you're done testing.

## Security notes

- Secrets live only in server environment variables — never in the browser bundle, code, or logs.
- Recipient addresses are validated as checksummed EVM addresses; amounts as positive bounded integer strings (wei).
- The server revalidates every parsed snapshot before execution; the transaction is built from the validated rule, never from free-form text.
- Broadcasts require explicit human confirmation and pass through KeeperHub's reliability layer (retries, smart gas estimation, observability).
- The MVP is testnet-only and runs one shared, capped demo wallet — it is never a visitor's wallet.

## Links

- Challenge brief & research: [`CHAINFLOW-DOCS/hios_challenge_brief.md`](CHAINFLOW-DOCS/hios_challenge_brief.md)
- Architecture: [`CHAINFLOW-DOCS/hios_architecture.md`](CHAINFLOW-DOCS/hios_architecture.md)
- KeeperHub: [docs.keeperhub.com](https://docs.keeperhub.com), [app.keeperhub.com](https://app.keeperhub.com)
