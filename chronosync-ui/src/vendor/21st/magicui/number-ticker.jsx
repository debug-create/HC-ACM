import React, { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function NumberTicker({
  value = 0,
  direction = "up",
  delay = 0,
  duration = 450,
  precision = 0,
  className,
  style,
  ...rest
}) {
  const [display, setDisplay] = useState(Number(value) || 0);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);
  const previousRef = useRef(Number(value) || 0);

  useEffect(() => {
    const next = Number(value) || 0;
    const prev = previousRef.current;
    previousRef.current = next;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const startAnim = () => {
      if (prefersReducedMotion() || duration <= 0) {
        setDisplay(next);
        return;
      }

      const start = performance.now();
      const startValue = prev;
      const delta = next - prev;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = startValue + delta * eased;
        setDisplay(current);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const actualDelay = Math.max(0, Number(delay) || 0);
    if (actualDelay > 0) {
      timeoutRef.current = setTimeout(startAnim, actualDelay);
    } else {
      startAnim();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay, duration, direction]);

  const rounded =
    precision > 0 ? Number(display).toFixed(precision) : String(Math.round(Number(display) || 0));

  return (
    <span className={className} style={style} {...rest}>
      {rounded}
    </span>
  );
}
