# ChainFlow — 4-Minute Demo Video Script

**Total runtime:** 4:00 · **Screen:** 1080p · **Narration:** conversational voice-over, no music bed louder than speech.

Demo facts used throughout (match the live app):

- Demo wallet / recipient: `0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1`
- Network: Ethereum Sepolia · Gas sponsored by KeeperHub
- Buttons in the app: **Simulate → Confirm & execute → Broadcast**
- Landing nav sections: Hero → How it Works → Safety → Use Cases → CTA

---

## Scene 1 — Cold open on the hero · 0:00–0:12

**[SHOT]** Landing page hero. Tagline *"Say it. Simulate it. Send it."* Cursor resting still at the center.

**VO:** "What if moving money onchain was as easy as sending a text message?"

**[SHOT]** Quick 2s pan across the hero art, then freeze.

**VO:** "That's ChainFlow — an AI agent that turns plain English into real, executed on-chain rules."

---

## Scene 2 — Scroll the landing sections · 0:12–0:42

**[SHOT]** Slow scroll from hero down through the page.

**VO:** "Here's the pitch — one screen. On the left, the flow."

**How it Works** section appears. Cursor highlights the three steps: *Describe → Review → Confirm & execute*.

**VO:** "You describe a rule in English. ChainFlow parses it into a structured, typed on-chain rule. You review exactly what will happen — then confirm."

**Safety** section appears. Cursor highlights the safety facts.

**VO:** "Nothing broadcasts until you say so. Every rule is simulated first, validated server-side, and rate-limited. Your wallet key never even touches the browser."

**Use Cases** section appears.

**VO:** "And it covers real triggers — manual transfers, recurring schedules, and condition-based rules like price or balance alerts."

**[SHOT]** Scroll to the CTA, click **Launch**.

**VO:** "Let's walk through it for real."

---

## Scene 3 — Land in the app, open the presets · 0:42–1:02

**[SHOT]** App loads. Empty chat state with the 4-step hint.

**VO:** "This is the main app. Clean chat, nothing pre-filled."

**[SHOT]** Click on the **Quick Transfer** preset. The prompt text fills into the composer.

**VO:** "Four presets ship with the app. Let me take this first one — a quick transfer — but instead of the canned example, I'm going to do it by hand."

**[SHOT]** Clear the preset text from the composer.

---

## Scene 4 — Open wallet, copy address · 1:02–1:22

**[SHOT]** Click the wallet pill in the top bar. The demo wallet panel opens showing the address.

**VO:** "First, the address I want to send to. Here's the demo wallet — the same funded test address every preset uses."

**[SHOT]** Hover and click the copy icon next to the address.

**VO:** "I'll copy it to the clipboard."

**[SHOT]** Cut back to the chat composer. Show the paste cursor, then type.

**VO:** "Then back in the chat, I'll type a normal English sentence — no transaction JSON, no wallet signing, no gas parameters."

---

## Scene 5 — Type the message, parsed card appears · 1:22–1:50

**[ON SCREEN]** Keystroke-by-keystroke the text:

> "Send 0.0005 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1"

**[SHOT]** Hit the send / parse action. Brief parse state, then the **ParsedRuleCard** slides in as a chat message.

**VO:** "Here it is — the parsed card. The LLM already read my sentence and pulled out the structure. Let's review it."

**[SHOT]** Cursor points at each field slowly:

**VO:** "Recipient — the exact address, no ambiguity. Amount — 0.0005 ETH. Network — Ethereum Sepolia. Trigger — one-shot manual, fires now."

**[SHOT]** Cursor moves to the **Simulate** button.

**VO:** "Simulation ran, and it says 'will not revert.' That's the safety gate — I can see the exact intent before any money actually moves."

---

## Scene 6 — Confirm, broadcast, receipt, Etherscan · 1:50–2:28

**[SHOT]** Click **Confirm & execute**, then **Broadcast**. Button shows "Broadcasting to Sepolia".

**VO:** "I'm confident in what it parsed, so — confirm, and execute. Broadcasting to Sepolia, fully sponsored."

**[SHOT]** The **ExecutionReceiptCard** posts into the thread. Cursor traces the fields.

**VO:** "And there's the proof. Execution receipt, straight into the chat. Path — it went through KeeperHub, gas sponsored, and here's the transaction hash."

**[SHOT]** Click the Etherscan link in the receipt. Brief Etherscan page load.

**VO:** "Click it and we're live on the explorer — the exact transaction, confirmed on-chain."

**[SHOT]** Back to the app.

**VO:** "Fast, verifiable, done."

---

## Scene 7 — Recurring transfer, one execution fires · 2:28–3:38

**[SHOT]** Click the **Recurring Transfer** preset.

**VO:** "Now the part that's actually powerful — automation."

**[SHOT]** Composer fills with:

> "Send 0.001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1 every 2 minutes"

**VO:** "I'll arm a recurring rule — every two minutes, this wallet sends 0.001 ETH. Same parse flow."

**[SHOT]** Parsed card appears, cursor points at the trigger field showing the schedule.

**VO:** "Note the trigger — 'recurring, every 2 minutes.' Not a one-shot anymore."

**[SHOT]** Click **Simulate**, then **Arm rule**.

**VO:** "I don't broadcast this manually — I arm it. Nothing fires until the condition is met. This is where the pull-based cron evaluator kicks in — it checks armed rules on each tick and fires any that match."

**[SHOT]** Zoom on the Activity tab (audit panel) as it updates.

**VO:** "Give it one tick, and there it goes — the cron fired the rule. One execution, executed automatically, no human in the loop."

**[SHOT]** The activity log shows the scheduled execution row.

**VO:** "And every run lands in the audit log with its own status, gas, and transaction hash."

**[SHOT]** Click **Disable** on the rule.

**VO:** "We'll disable the rule now so it doesn't keep firing while I wrap up."

---

## Scene 8 — Outro · 3:38–4:00

**[SHOT]** Pull back to the full chat thread showing both receipts — manual and auto-executed.

**VO:** "From a plain-English sentence to a confirmed on-chain transfer in seconds — and the same interface that just moved money can also hold it and schedule it for you."

**[SHOT]** Fade to brand-end card / CTA.

**ON SCREEN:** ChainFlow · Say it. Simulate it. Send it.

**VO:** "ChainFlow — natural-language rules, executed reliably onchain through KeeperHub. Thanks for watching."

**[SHOT]** Black out.

---

## Notes for the editor

- **Clip names:** keep two long takes — one unbroken landing scroll (Scene 2), one unbroken app walkthrough (Scenes 3–7). Every scene above is a cut point.
- **Zoom highlights:** on the recipient field, the Simulate button, the receipt's Etherscan link, and the Activity row.
- **Rehearsal pacing:** don't read to the beat, move deliberately at each cursor highlight, and wait ~1s after a click before continuing — it sells "real product, real timing."
- **Safety claim wording:** stick to "separated", "simulated", "confirmed", "sponsored" — do not improvise the word "mainnet".