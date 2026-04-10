import React, { useMemo } from "react";

export default function AnimatedCircularProgress({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = "#10B981",
  trackColor = "rgba(255,255,255,0.12)",
  className,
  children,
  ...rest
}) {
  const normalizedMax = Number(max) > 0 ? Number(max) : 100;
  const normalizedValue = Math.max(0, Math.min(normalizedMax, Number(value) || 0));
  const radius = (Number(size) - Number(strokeWidth)) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = normalizedValue / normalizedMax;

  const dashOffset = useMemo(() => circumference * (1 - progress), [circumference, progress]);

  return (
    <div
      className={["relative inline-flex items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      {...rest}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 320ms ease, stroke 320ms ease" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  );
}
