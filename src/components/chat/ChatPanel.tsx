'use client';

import React, { useState } from 'react';
import { ParsedRule } from '@/types/rule';
import { ParsedRuleCard } from './ParsedRuleCard';
import { Send, Bot, User, Sparkles } from 'lucide-react';

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
      text: 'Welcome to ChainFlow! Type your on-chain rule in plain English (or pick a preset below), and I will parse it into a structured execution trigger for KeeperHub.',
      timestamp: 'Just now',
    },
  ]);
  const [isParsing, setIsParsing] = useState(false);

  // React to external prompt changes (e.g. from PresetBar clicks)
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
    <div className="w-full h-full flex flex-col justify-between bg-[#070911] border-r border-white/10 overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[90%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2">
              <div
                className={`p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-600/30 text-purple-100 border border-purple-500/30 rounded-tr-none'
                    : 'bg-white/[0.04] text-gray-200 border border-white/10 rounded-tl-none'
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
          <div className="flex gap-3 items-center text-xs text-cyan-400 bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AI is parsing rule parameters...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-white/10 bg-[#090b14]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white/[0.04] border border-white/10 focus-within:border-cyan-500/50 rounded-2xl p-2 transition-all shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an on-chain automation rule in plain English..."
            disabled={isParsing || isExecuting}
            className="flex-1 bg-transparent px-3 text-xs text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isParsing || isExecuting}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all disabled:opacity-30 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 shadow-[0_0_10px_rgba(0,212,255,0.3)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
