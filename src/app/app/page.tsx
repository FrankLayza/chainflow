"use client";

import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function AppPage() {
  return (
    <main className="h-screen w-screen bg-absolute text-warm-off-white font-sora overflow-hidden flex flex-col">
      {/* Navbar Header */}
      <TopBar />

      {/* Main Content */}
      <div className="flex-1 w-full bg-absolute overflow-hidden">
        <ChatPanel 
          onParsePrompt={async (prompt) => {
            const res = await fetch('/api/parse-rule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Failed to parse rule');
            }
            return data.rule;
          }}
          onActivateRule={async (rule) => {
            const res = await fetch('/api/execute-rule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rule }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Failed to execute rule');
            }
            console.log('Rule execution response:', data);
          }}
        />
      </div>
    </main>
  );
}
