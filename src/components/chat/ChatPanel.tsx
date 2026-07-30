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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Welcome to ChainFlow. Type an on-chain rule in plain English and I will parse it into a structured execution trigger for KeeperHub.',
      timestamp: 'Just now',
    },
  ]);
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
    <div className="w-full h-full flex flex-col bg-deep-ember border-r border-iron-veil overflow-hidden">
      {/* Column Header */}
      <div className="px-6 pt-4 pb-2 border-b border-iron-veil">
        <span className="text-caption-tracked uppercase tracking-[0.15em] text-bone-gray font-mono">Rule Composer</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-smoke-charcoal border-iron-veil text-warm-off-white'
                  : 'bg-iron-veil border-faint-linen/20 text-muted-cobalt'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="space-y-2">
              <div
                className={`p-3 rounded-lg text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-smoke-charcoal text-warm-off-white border border-iron-veil'
                    : 'bg-iron-veil text-warm-off-white border border-faint-linen/10'
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
          <div className="flex gap-3 items-center text-sm text-muted-cobalt bg-iron-veil p-3 rounded-lg border border-faint-linen/10 w-fit">
            <span className="animate-pulse">Parsing rule parameters...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-iron-veil bg-deep-ember">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 bg-smoke-charcoal border border-iron-veil focus-within:border-pale-stone rounded-md p-2 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an on-chain automation rule in plain English..."
            disabled={isParsing || isExecuting}
            className="flex-1 bg-transparent px-3 text-sm text-warm-off-white placeholder-bone-gray/50 focus:outline-none disabled:opacity-50 font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || isParsing || isExecuting}
            className="px-3 py-1.5 rounded-md bg-warm-off-white text-deep-ember text-sm font-medium transition-all duration-150 hover:bg-pale-stone disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
