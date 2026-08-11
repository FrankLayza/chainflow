"use client";

import React from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { ParsedRuleCard } from "./ParsedRuleCard";
import { ExecutionReceiptCard } from "./ExecutionReceiptCard";
import { ChatEmptyState } from "./ChatEmptyState";
import { MessageScroller } from "@/components/agents/message-scroller";
import { FieldGrid } from "@/components/ui/FieldGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import type {
  ExecState,
  ExecutionReceipt,
  ParsedRule,
  RuleSimulation,
  SimState,
} from "@/types/rule";

type Message =
  | { id: string; kind: "user"; text: string; at: string }
  | { id: string; kind: "parseError"; message: string; prompt: string; at: string }
  | { id: string; kind: "parsing"; at: string }
  | {
      id: string;
      kind: "rule";
      /** Id of the user bubble that produced this card, so cancelling can remove the pair. */
      userId?: string;
      rule: ParsedRule;
      sim: SimState;
      exec: ExecState;
      execError?: string;
      at: string;
    }
  | { id: string; kind: "receipt"; receipt: ExecutionReceipt; at: string };

interface ChatPanelProps {
  onParsePrompt: (prompt: string) => Promise<ParsedRule | null>;
  onSimulateRule: (rule: ParsedRule) => Promise<RuleSimulation | null>;
  onActivateRule: (rule: ParsedRule) => Promise<ExecutionReceipt | null>;
  isExecuting?: boolean;
  /** Pre-fills the composer from a `?rule=` deep link. Never auto-submits. */
  initialPrompt?: string | null;
}

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

const errText = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onParsePrompt,
  onSimulateRule,
  onActivateRule,
  isExecuting,
  initialPrompt,
}) => {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const seededRef = React.useRef(false);

  // Seeds once. A previous version keyed this to a prop and re-fired on every
  // change with a stale closure over the send handler.
  React.useEffect(() => {
    if (seededRef.current || !initialPrompt) return;
    seededRef.current = true;
    setInput(initialPrompt);
  }, [initialPrompt]);

  const patch = React.useCallback((id: string, next: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? ({ ...m, ...next } as Message) : m)),
    );
  }, []);

  /** Removes a parsed-rule card and the user message that produced it, so a
      user can back out of an action before any execution is armed. */
  const discardRule = React.useCallback((id: string) => {
    setMessages((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target || target.kind !== "rule") return prev;
      const removed = new Set([id, ...(target.userId ? [target.userId] : [])]);
      return prev.filter((m) => !removed.has(m.id));
    });
  }, []);

  const simulate = React.useCallback(
    async (id: string, rule: ParsedRule) => {
      patch(id, { sim: { phase: "simulating" } });
      try {
        const simulation = await onSimulateRule(rule);
        patch(id, {
          sim: simulation
            ? { phase: "done", simulation }
            : { phase: "error", message: "Simulator returned no result." },
        });
      } catch (e) {
        // Reported as a simulation failure, not a parse failure — and the
        // spinner always resolves, because `sim` leaves the simulating phase on
        // every path.
        patch(id, {
          sim: { phase: "error", message: errText(e, "Simulation failed") },
        });
      }
    },
    [onSimulateRule, patch],
  );

  const send = React.useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || isParsing || isExecuting) return;

      const userMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, kind: "user", text: prompt, at: now() },
      ]);
      setInput("");
      setIsParsing(true);

      const parsingId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: parsingId, kind: "parsing", at: now() }]);

      let rule: ParsedRule | null = null;
      try {
        rule = await onParsePrompt(prompt);
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === parsingId
              ? {
                  id: m.id,
                  kind: "parseError",
                  message: errText(e, "Could not parse that rule"),
                  prompt,
                  at: m.at,
                }
              : m,
          ),
        );
        setIsParsing(false);
        return;
      } finally {
        setIsParsing(false);
      }

      if (!rule) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === parsingId
              ? {
                  id: m.id,
                  kind: "parseError",
                  message: "No rule was returned for that prompt.",
                  prompt,
                  at: m.at,
                }
              : m,
          ),
        );
        return;
      }

      const parsed = rule;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === parsingId
            ? {
                id: m.id,
                kind: "rule",
                userId: userMsgId,
                rule: parsed,
                sim: { phase: "simulating" },
                exec: "idle",
                at: m.at,
              }
            : m,
        ),
      );

      await simulate(parsingId, parsed);
    },
    [isParsing, isExecuting, onParsePrompt, simulate],
  );

  const broadcast = React.useCallback(
    async (id: string, rule: ParsedRule) => {
      patch(id, { exec: "executing" });
      try {
        const receipt = await onActivateRule(rule);
        if (!receipt) {
          patch(id, { exec: "failed", execError: "Execution was already in flight." });
          return;
        }
        patch(id, { exec: "done" });
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), kind: "receipt", receipt, at: now() },
        ]);
      } catch (e) {
        patch(id, { exec: "failed", execError: errText(e, "Execution failed") });
      }
    },
    [onActivateRule, patch],
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 overflow-hidden">
      <MessageScroller
        navigation="rail"
        busy={isParsing}
        label="Chat transcript"
        className="flex-1 min-h-0"
        contentClassName="w-full max-w-3xl mx-auto px-6 py-6"
      >
        {messages.length === 0 ? (
          <ChatEmptyState onPick={send} />
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-slot="message"
                data-from={msg.kind === "user" ? "user" : "assistant"}
              >
                <MessageRow
                  msg={msg}
                  globallyLocked={Boolean(isExecuting)}
                  onConfirm={() => patch(msg.id, { exec: "confirming" })}
                  onCancelConfirm={() => patch(msg.id, { exec: "idle" })}
                  onDiscard={() => discardRule(msg.id)}
                  onBroadcast={() =>
                    msg.kind === "rule" && broadcast(msg.id, msg.rule)
                  }
                  onRetrySimulate={() =>
                    msg.kind === "rule" && simulate(msg.id, msg.rule)
                  }
                  onResetExec={() =>
                    patch(msg.id, { exec: "idle", execError: undefined })
                  }
                  onEditPrompt={(p) => setInput(p)}
                />
              </div>
            ))}
          </div>
        )}
      </MessageScroller>

      <div className="w-full shrink-0 border-t border-white/[0.06]">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a transfer in plain English…"
              disabled={isParsing || isExecuting}
              aria-label="Describe a transfer"
              className={cn(
                "flex-1 min-w-0 bg-gray-900 border border-white/[0.06] rounded-xl px-4 py-3",
                "text-sm text-white placeholder:text-gray-500",
                "focus:border-violet-500/40 focus-visible:outline-none",
                "transition-[border-color] duration-150 ease-out",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isParsing || isExecuting}
              aria-label="Send"
              className={cn(
                "shrink-0 inline-flex items-center justify-center px-4 py-3 rounded-xl cursor-pointer",
                "bg-violet-500 text-white",
                "hover:bg-violet-600",
                "transition-[background-color,transform] duration-150 ease-out active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 motion-safe:animate-spin" strokeWidth={2} />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function MessageRow({
  msg,
  globallyLocked,
  onConfirm,
  onCancelConfirm,
  onDiscard,
  onBroadcast,
  onRetrySimulate,
  onResetExec,
  onEditPrompt,
}: {
  msg: Message;
  globallyLocked: boolean;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onDiscard: () => void;
  onBroadcast: () => void;
  onRetrySimulate: () => void;
  onResetExec: () => void;
  onEditPrompt: (prompt: string) => void;
}) {
  if (msg.kind === "user") {
    return (
      <div className="flex justify-end">
        <div
          data-slot="message-content"
          className="max-w-[80%] bg-gray-800 border border-white/[0.06] rounded-2xl px-4 py-3"
        >
          <p className="text-sm text-white leading-relaxed">{msg.text}</p>
          <span className="mt-1 block font-mono text-[11px] text-gray-500 text-right">
            {msg.at}
          </span>
        </div>
      </div>
    );
  }

  if (msg.kind === "parsing") {
    return (
      <div className="w-full bg-gray-800 rounded-2xl p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-[11px] uppercase tracking-[0.04em] text-gray-500 font-mono">
            Parsed rule
          </span>
          <StatusBadge tone="live" label="Parsing" pulse />
        </div>
        <FieldGrid skeleton />
      </div>
    );
  }

  if (msg.kind === "parseError") {
    return (
      <div className="w-full rounded-2xl bg-danger/10 border border-danger/30 p-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="w-4 h-4 text-danger shrink-0 mt-0.5"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-danger">
              Couldn&apos;t read that as a rule
            </p>
            <p className="font-mono text-[13px] text-gray-400 break-words">
              {msg.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEditPrompt(msg.prompt)}
          className={cn(
            "mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer",
            "border border-white/[0.08] text-gray-400 text-sm",
            "hover:text-white hover:border-white/[0.15]",
            "transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
          )}
        >
          Edit prompt
        </button>
      </div>
    );
  }

  if (msg.kind === "rule") {
    return (
      <div className="space-y-2">
        <ParsedRuleCard
          rule={msg.rule}
          sim={msg.sim}
          exec={msg.exec}
          onConfirm={onConfirm}
          onCancelConfirm={onCancelConfirm}
          onDiscard={onDiscard}
          onBroadcast={onBroadcast}
          onRetrySimulate={onRetrySimulate}
          onResetExec={onResetExec}
          globallyLocked={globallyLocked}
        />
        {msg.exec === "failed" && msg.execError && (
          <p className="px-1 font-mono text-[13px] text-danger break-words">
            {msg.execError}
          </p>
        )}
      </div>
    );
  }

  return <ExecutionReceiptCard receipt={msg.receipt} />;
}
