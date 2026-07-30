'use client';

import React from 'react';
import { PRESET_RULES, PresetRule } from '@/lib/ai/presets';
import { ArrowUpRight, TrendingDown, Clock, Sparkles } from 'lucide-react';

interface PresetBarProps {
  onSelectPreset: (preset: PresetRule) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  ArrowUpRight: <ArrowUpRight className="w-4 h-4 text-cyan-400" />,
  TrendingDown: <TrendingDown className="w-4 h-4 text-purple-400" />,
  Clock: <Clock className="w-4 h-4 text-emerald-400" />,
};

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset, disabled }) => {
  return (
    <div className="w-full bg-[#0d0f17]/90 border-t border-white/10 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Quick Preset Rules (1-Click Demo):</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {PRESET_RULES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              disabled={disabled}
              className="flex-1 md:flex-initial flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs font-medium text-gray-200 transition-all group disabled:opacity-50 text-left"
            >
              <div className="p-1 rounded-md bg-white/[0.05] group-hover:scale-110 transition-transform">
                {iconMap[preset.iconName]}
              </div>
              <div>
                <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {preset.title}
                </span>
                <span className="hidden lg:inline text-[10px] text-gray-400 block">
                  {preset.category === 'sweep'
                    ? 'Bal > 0.05 ETH → Transfer'
                    : preset.category === 'price'
                    ? 'Price < $2500 → Hedge'
                    : 'Recurring 24h Transfer'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
