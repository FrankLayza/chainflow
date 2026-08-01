"use client";

import React from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { steps, toneClass } from "./steps";
import { useSequence } from "./use-sequence";

export function HowItWorks() {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-120px" });
  const reduceMotion = useReducedMotion();
  const phase = useSequence(steps.length, inView, Boolean(reduceMotion));
  const complete = phase > steps.length;

  return (
    <MotionConfig reducedMotion="user">
      <section ref={sectionRef} className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
              How it works
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-white">
              Three steps to your first automation
            </h2>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-14 lg:items-center">
            <ol className="space-y-10">
              {steps.map((step, i) => {
                const state =
                  phase > i + 1 ? "done" : phase === i + 1 ? "active" : "pending";
                const isLast = i === steps.length - 1;

                return (
                  <li key={step.number} className="relative flex items-start gap-5">
                    {!isLast && (
                      <div
                        aria-hidden
                        className="absolute left-5 top-10 -bottom-10 w-px bg-white/10"
                      >
                        <motion.div
                          className="absolute inset-0 origin-top bg-violet-500/70"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: state === "done" ? 1 : 0 }}
                          transition={{
                            duration: 0.45,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </div>
                    )}

                    <div
                      aria-hidden
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        "text-sm font-semibold font-mono ring-1",
                        "transition-[color,background-color,box-shadow] duration-300 ease-out",
                        state === "pending" &&
                          "bg-white/3 text-gray-400 ring-white/10",
                        state === "active" &&
                          "bg-violet-500/15 text-violet-400 ring-violet-500/50",
                        state === "done" &&
                          "bg-violet-500/10 text-violet-400 ring-violet-500/25",
                      )}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.span
                          key={state === "done" ? "done" : "number"}
                          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                          className="flex items-center justify-center"
                        >
                          {state === "done" ? (
                            <Check className="w-4 h-4" strokeWidth={2} />
                          ) : (
                            step.number
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                        delay: i * 0.1,
                      }}
                      viewport={{ once: true, margin: "-80px" }}
                      className="pb-1"
                    >
                      <h3
                        className={cn(
                          "text-lg font-semibold transition-colors duration-300 ease-out",
                          state === "pending" ? "text-gray-400" : "text-white",
                        )}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400 text-pretty">
                        {step.description}
                      </p>
                    </motion.div>
                  </li>
                );
              })}
            </ol>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              viewport={{ once: true, margin: "-60px" }}
              className="rounded-2xl bg-gray-900 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_-1px_rgba(0,0,0,0.6),0_12px_32px_-12px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/6">
                <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
                  chainflow · sepolia
                </span>
                <span className="flex items-center gap-2 text-xs font-mono">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors duration-300 ease-out",
                      complete ? "bg-success" : "bg-gray-600",
                    )}
                  />
                  <span
                    className={cn(
                      "transition-colors duration-300 ease-out",
                      complete ? "text-success" : "text-gray-400",
                    )}
                  >
                    {complete ? "confirmed" : "running"}
                  </span>
                </span>
              </div>

              <div className="px-5 py-4 space-y-3 font-mono text-sm">
                {steps.flatMap((step, stepIndex) =>
                  step.lines.map((line, lineIndex) => (
                    <motion.div
                      key={`${step.number}-${lineIndex}`}
                      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                      animate={
                        phase > stepIndex
                          ? { opacity: 1, y: 0, filter: "blur(0px)" }
                          : { opacity: 0, y: 6, filter: "blur(4px)" }
                      }
                      transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                        delay: lineIndex * 0.09,
                      }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={cn("shrink-0", toneClass[line.tone].prefix)}
                      >
                        {line.prefix}
                      </span>
                      <span className={toneClass[line.tone].text}>
                        {line.text}
                      </span>
                    </motion.div>
                  )),
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
