"use client";

import React from "react";

/**
 * Reports how many steps the reader has scrolled past.
 *
 * This replaces a single timed sequence that fired once when the section
 * entered view: on a tall section the whole trace could finish before the
 * reader reached step two, so the terminal was already `confirmed` while they
 * were still reading step one. Advancing per step keeps the trace tied to
 * reading position instead of to a clock.
 */
export function useStepProgress(count: number, skip: boolean) {
  const [reached, setReached] = React.useState(0);
  const [settled, setSettled] = React.useState(false);

  const markReached = React.useCallback((index: number) => {
    // Monotonic: scrolling back up must not rewind completed steps.
    setReached((prev) => Math.max(prev, index + 1));
  }, []);

  React.useEffect(() => {
    if (skip) {
      setReached(count);
      setSettled(true);
    }
  }, [skip, count]);

  // The last step only reads "done" after a beat, so the final checkmark and
  // the `confirmed` status land as an arrival rather than instantly.
  React.useEffect(() => {
    if (skip || reached < count) return;
    const id = window.setTimeout(() => setSettled(true), 520);
    return () => window.clearTimeout(id);
  }, [reached, count, skip]);

  return { reached, settled, markReached };
}
