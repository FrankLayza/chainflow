"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { ACTIVITY_DRAWER_ID } from "@/components/layout/TopBar";
import { EASE_DRAWER } from "@/lib/ease";
import { cn } from "@/lib/utils";

interface ActivityDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Right-anchored overlay drawer for the Activity panel. The chat stays mounted
 * behind it; the scrim dims it and a recede handled by the parent (see
 * page.tsx) lets the chat settle toward the center while the drawer arrives.
 * Closed: offscreen, inert, and out of the pointer tree.
 */
export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  open,
  onClose,
  children,
}) => {
  const reduce = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div
      id={ACTIVITY_DRAWER_ID}
      inert={!open}
      className={cn(
        "absolute inset-0 z-40",
        open ? "" : "pointer-events-none",
      )}
    >
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        onClick={onClose}
        aria-hidden
        className={cn(
          "absolute inset-0 bg-black/50",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Activity"
        tabIndex={-1}
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ duration: reduce ? 0 : 0.4, ease: EASE_DRAWER }}
        className={cn(
          "absolute inset-y-0 right-0 w-full sm:w-[420px] flex flex-col",
          "bg-gray-900 border-l border-white/[0.06] shadow-2xl",
          "focus-visible:outline-none",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};
