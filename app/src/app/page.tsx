'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PresetBar } from '@/components/layout/PresetBar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AuditDashboard } from '@/components/dashboard/AuditDashboard';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { ExecutionRecord, ParsedRule } from '@/types/rule';
import { PresetRule } from '@/lib/ai/presets';

export default function Home() {
  const [selectedRule, setSelectedRule] = useState<ParsedRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState<string>('');

  // Audit Store State
  const [rules, setRules] = useState<ParsedRule[]>([]);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [walletInfo, setWalletInfo] = useState<{ address: string; network: string }>({
    address: '0xcafa...d221',
    network: 'Ethereum Sepolia',
  });
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Fetch Audit Logs & Rules
  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setExecutions(data.executions || []);
        if (data.wallet) {
          setWalletInfo({
            address: data.wallet.address.slice(0, 6) + '...' + data.wallet.address.slice(-4),
            network: 'Ethereum Sepolia',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  // Parse natural language rule API call
  const handleParsePrompt = async (prompt: string): Promise<ParsedRule | null> => {
    const res = await fetch('/api/parse-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to parse rule');
    }

    const data = await res.json();
    return data.rule;
  };

  // Open confirmation modal when user clicks Activate
  const handleActivateClick = (rule: ParsedRule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  // Execute rule via KeeperHub API
  const handleConfirmExecution = async (rule: ParsedRule) => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/execute-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Execution failed');
      }

      await fetchAuditLogs();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`KeeperHub Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetRule) => {
    setExternalPrompt(preset.promptText);
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-[#06060a] text-white overflow-hidden font-sans">
      {/* Top Header */}
      <TopBar walletAddress={walletInfo.address} networkName={walletInfo.network} />

      {/* Main Two-Panel Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Chat Panel (45%) */}
        <div className="w-full md:w-[45%] h-1/2 md:h-full border-b md:border-b-0 border-white/10">
          <ChatPanel
            onParsePrompt={handleParsePrompt}
            onActivateRule={handleActivateClick}
            isExecuting={isExecuting}
            externalPrompt={externalPrompt}
          />
        </div>

        {/* Audit Dashboard Panel (55%) */}
        <div className="w-full md:w-[55%] h-1/2 md:h-full bg-[#090b14]/50 backdrop-blur-xl">
          <AuditDashboard
            rules={rules}
            executions={executions}
            onRefresh={fetchAuditLogs}
            isLoading={isLoadingAudit}
          />
        </div>
      </div>

      {/* Preset Rules Bar at Bottom */}
      <PresetBar onSelectPreset={handleSelectPreset} disabled={isExecuting} />

      {/* Safety Gate Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        rule={selectedRule}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmExecution}
        isExecuting={isExecuting}
      />
    </main>
  );
}
