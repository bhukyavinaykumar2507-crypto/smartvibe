import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

/**
 * Smoothly interpolates numeric sensor values via requestAnimationFrame.
 * Respects prefers-reduced-motion by snapping directly when enabled.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 2,
  duration = 320,
  className = '',
}) => {
  const safeTarget = Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState<number>(safeTarget);
  const currentRef = useRef<number>(safeTarget);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || duration <= 0) {
      currentRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    const startVal = currentRef.current;
    const delta = safeTarget - startVal;
    if (Math.abs(delta) < 1e-6) {
      currentRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + delta * eased;
      currentRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = safeTarget;
        setDisplayValue(safeTarget);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [safeTarget, duration]);

  return <span className={className}>{displayValue.toFixed(decimals)}</span>;
};
