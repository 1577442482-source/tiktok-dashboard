import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  target: number;
  duration?: number;
  enabled?: boolean;
  decimals?: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp({ target, duration = 1200, enabled = true, decimals = 0 }: UseCountUpOptions): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const startValue = prevTarget.current !== target ? value : 0;
    prevTarget.current = target;

    cancelAnimationFrame(rafRef.current);

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      setValue(startValue + (target - startValue) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return enabled ? Number(value.toFixed(decimals)) : target;
}
