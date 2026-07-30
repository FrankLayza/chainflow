'use client';

import React, { useState } from 'react';
import { ParsedRule } from '@/types/rule';
import { ParsedRuleCard } from './ParsedRuleCard';
import { Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  parsedRule?: ParsedRule;
  timestamp: string;
}

interface ChatPanelProps {
  onParsePrompt: (prompt: string) => Promise<ParsedRule | null>;
  onActivateRule: (rule: ParsedRule) => void;
  isExecuting?: boolean;
  externalPrompt?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onParsePrompt,
  onActivateRule,
  isExecuting,
  externalPrompt,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isParsing, setIsParsing] = useState(false);

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
          text: 'Here is the structured automation rule parsed from your request:',
          parsedRule,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
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
                    onActivate={onActivateRule}
                    isExecuting={isExecuting}
                  />
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

      {/* Chat Input Bar */}
      <div className="w-full bg-absolute border-t border-iron-veil/60">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
          {/* Presets */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[
              "Buy 1 ETH when price is below $2000",
              "Swap 100 USDC to BTC every week",
              "Sell 50% of UNI if it drops by 10%"
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
