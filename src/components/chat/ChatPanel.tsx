'use client';

import React, { useState } from 'react';
import { ParsedRule } from '@/types/rule';
import { ParsedRuleCard, RuleSimulation } from './ParsedRuleCard';
import { Send, Bot, User, Copy, Check, ExternalLink } from 'lucide-react';

export interface ExecutionReceipt {
  executionId?: string;
  status: string;
  txHash?: string;
  explorerUrl?: string;
  gasUsed?: string;
  viaMcp: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  parsedRule?: ParsedRule;
  simulation?: RuleSimulation | null;
  isSimulating?: boolean;
  receipt?: ExecutionReceipt | null;
  timestamp: string;
}

interface ChatPanelProps {
  onParsePrompt: (prompt: string) => Promise<ParsedRule | null>;
  onActivateRule: (rule: ParsedRule) => Promise<ExecutionReceipt | null>;
  onSimulateRule: (rule: ParsedRule) => Promise<RuleSimulation | null>;
  isExecuting?: boolean;
  externalPrompt?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onParsePrompt,
  onActivateRule,
  onSimulateRule,
  isExecuting,
  externalPrompt,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
    }
  }, [externalPrompt]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isParsing) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsParsing(true);

    try {
      const parsedRule = await onParsePrompt(textToSend);
      if (parsedRule) {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: 'Here is the structured rule parsed from your request:',
          parsedRule,
          isSimulating: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);

        const simulation = await onSimulateRule(parsedRule);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id ? { ...m, simulation, isSimulating: false } : m
          )
        );
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: `Could not parse rule: ${error.message || 'Please try rephrasing.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  };

  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleActivate = async (rule: ParsedRule) => {
    try {
      const receipt = await onActivateRule(rule);
      if (receipt) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: 'Execution complete. On-chain receipt:',
            receipt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: `Execution failed: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-absolute overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-smoke-charcoal border-iron-veil text-warm-off-white'
                    : 'bg-iron-veil border-faint-linen/20 text-muted-cobalt'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-3 max-w-[80%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-smoke-charcoal text-warm-off-white border border-iron-veil'
                      : 'bg-iron-veil/50 text-warm-off-white border border-faint-linen/10'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.parsedRule && (
                  <ParsedRuleCard
                    rule={msg.parsedRule}
                    onActivate={handleActivate}
                    isExecuting={isExecuting}
                    simulation={msg.simulation}
                    isSimulating={msg.isSimulating}
                  />
                )}

                {msg.receipt && (
                  <div className="w-full rounded-lg bg-smoke-charcoal border border-faint-linen/20 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-iron-veil pb-3">
                      <span className="text-caption-tracked uppercase tracking-wider text-muted-cobalt font-mono">
                        Execution Receipt
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-gold-leaf">
                        <Check className="w-3.5 h-3.5" />
                        {msg.receipt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-iron-veil rounded-md overflow-hidden mb-4">
                      <div className="bg-smoke-charcoal p-3">
                        <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">Execution Path</span>
                        <span className="text-sm font-mono text-muted-cobalt">
                          {msg.receipt.viaMcp ? 'KeeperHub MCP' : 'KeeperHub REST'}
                        </span>
                      </div>
                      <div className="bg-smoke-charcoal p-3">
                        <span className="text-caption-tracked uppercase tracking-wider text-bone-gray font-mono block mb-0.5">Gas</span>
                        <span className="text-sm font-mono text-gold-leaf">
                          {msg.receipt.gasUsed || 'Sponsored by KeeperHub'}
                        </span>
                      </div>
                    </div>

                    {msg.receipt.txHash && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-iron-veil border border-faint-linen/10 mb-3">
                        <span className="text-sm font-mono text-warm-off-white flex-1 truncate">
                          {msg.receipt.txHash.slice(0, 10)}...{msg.receipt.txHash.slice(-8)}
                        </span>
                        <button
                          onClick={() => msg.receipt?.txHash && copyTxHash(msg.receipt.txHash)}
                          className="text-muted-cobalt hover:text-warm-off-white transition-colors"
                          aria-label="Copy transaction hash"
                        >
                          {copied ? <Check className="w-4 h-4 text-gold-leaf" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {msg.receipt.explorerUrl && (
                          <a
                            href={msg.receipt.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-muted-cobalt hover:text-warm-off-white transition-colors"
                          >
                            <span>Etherscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isParsing && (
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-iron-veil border-faint-linen/20 text-muted-cobalt">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-iron-veil/50 text-muted-cobalt border border-faint-linen/10">
                <span className="animate-pulse">Parsing rule parameters...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-absolute border-t border-iron-veil/60">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[
              "Transfer 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1",
              "If balance > 0.05 ETH, transfer 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1",
              "If ETH price is below $10000, transfer 0.0001 ETH to 0xd2107C0e5fd43faDd5D3200F6084C3786a83A7A1"
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setInput(preset)}
                className="text-xs px-3 py-1.5 rounded-full border border-iron-veil hover:border-pale-stone text-bone-gray hover:text-warm-off-white transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 bg-smoke-charcoal border border-iron-veil focus-within:border-pale-stone rounded-2xl p-2 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type an on-chain automation rule in plain English..."
              disabled={isParsing || isExecuting}
              className="flex-1 bg-transparent px-3 py-1 text-sm text-warm-off-white placeholder-bone-gray/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isParsing || isExecuting}
              className="px-4 py-2 rounded-2xl bg-warm-off-white text-deep-ember text-sm font-medium transition-all duration-150 hover:bg-pale-stone disabled:opacity-30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
