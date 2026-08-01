/**
 * Landing-page entrance primitives.
 *
 * One easing curve for the whole page: `[0.16, 1, 0.3, 1]`, per `design.md` §6.
 * (A proposed `[0.22, 1, 0.36, 1]` was rejected — two near-identical ease-out
 * quints on one page reads as inconsistency, not intent.)
 *
 * No looping animations. An idle "glow pulse" on the CTA was also rejected:
 * it contradicts motion restraint, and a financial action should not shimmer to
 * attract clicks.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

export const DURATION = 0.5;
export const STAGGER = 0.08;
export const Y_OFFSET = 16;

/** Standard scroll-into-view entrance. Pass an index for staggered children. */
export function riseIn(index = 0, reduceMotion?: boolean | null) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: Y_OFFSET },
    whileInView: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: {
      duration: DURATION,
      ease: EASE,
      delay: index * STAGGER,
    },
  };
}

/** Section heading block: eyebrow + title, entering as one unit. */
export function headingIn(reduceMotion?: boolean | null) {
  return riseIn(0, reduceMotion);
}
