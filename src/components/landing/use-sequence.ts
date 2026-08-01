"use client";

import React from "react";

const PHASE_MS = 620;

export function useSequence(count: number, active: boolean, skip: boolean) {
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    if (skip) {
      setPhase(count + 1);
      return;
    }
    const timers = Array.from({ length: count + 1 }, (_, i) =>
      window.setTimeout(() => setPhase(i + 1), 260 + i * PHASE_MS),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [active, skip, count]);

  return phase;
}
