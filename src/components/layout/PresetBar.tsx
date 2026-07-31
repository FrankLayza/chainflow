'use client';

import React from 'react';
import { PRESET_RULES, PresetRule } from '@/lib/ai/presets';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface PresetBarProps {
  onSelectPreset: (preset: PresetRule) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  ArrowUpRight: <ArrowUpRight className="w-4 h-4 text-muted-cobalt" />,
};

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset, disabled }) => {
  return (
    <div className="w-full bg-deep-ember border-b border-iron-veil px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-caption-tracked uppercase tracking-[0.15em] text-bone-gray font-mono">
          <Sparkles className="w-3.5 h-3.5 text-muted-cobalt" />
          <span>Quick Presets</span>
        </div>

        <div className="flex items-center gap-2">
          {PRESET_RULES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-smoke-charcoal border border-iron-veil text-warm-off-white text-[13px] transition-all duration-150 hover:bg-slate-hearth hover:border-pale-stone disabled:opacity-40"
            >
              <span className="flex items-center justify-center w-5 h-5">
                {iconMap[preset.iconName]}
              </span>
              <span className="font-medium">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
