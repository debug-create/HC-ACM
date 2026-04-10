import React, { useEffect, useMemo, useRef, useState } from "react";
import { DELAY_MODES } from "../constants";
import NumberTicker from "21st.dev/r/magicui/number-ticker";
import AnimatedCircularProgress from "21st.dev/r/animate-ui/circular-progress";

function formatHMS(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function sanitizeModeLabel(label) {
  return String(label || "").replaceAll("â€”", "—");
}

function getBandwidthColor(bandwidth) {
  if (bandwidth > 60) return "#10B981";
  if (bandwidth >= 30) return "#F59E0B";
  return "#EF4444";
}

function getDelayBadge(ms) {
  const value = Number(ms);
  if (value === 8000) return { text: "8s", bg: "#14532D", color: "#86EFAC", pulse: false };
  if (value === 90000) return { text: "90s", bg: "#451A03", color: "#FCD34D", pulse: false };
  if (value === 300000) return { text: "5m", bg: "#7F1D1D", color: "#FCA5A5", pulse: false };
  if (value === 1200000) return { text: "20m", bg: "#7F1D1D", color: "#EF4444", pulse: true };
  if (value >= 60000) return { text: `${Math.round(value / 60000)}m`, bg: "#111827", color: "#E8E8E8", pulse: false };
  if (value >= 1000) return { text: `${Math.round(value / 1000)}s`, bg: "#111827", color: "#E8E8E8", pulse: false };
  return { text: `${value}ms`, bg: "#111827", color: "#E8E8E8", pulse: false };
}

function SimControlPanel({
  config,
  stats,
  onDelayChange,
  onBandwidthChange,
  onPacketLossChange,
  onDropConnection,
  onRestoreConnection,
}) {
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [restoreRipple, setRestoreRipple] = useState(false);
  const panelRef = useRef(null);
  const rippleTimeoutRef = useRef(null);

  const selectedScenario = useMemo(() => {
    const byDelay = DELAY_MODES.find((m) => m.ms === Number(config?.delay_ms));
    if (byDelay) return byDelay;
    const byLabel = DELAY_MODES.find((m) => m.label === config?.mode);
    return byLabel || DELAY_MODES[0];
  }, [config?.delay_ms, config?.mode]);

  const bandwidthValue = Number(config?.bandwidth ?? 0);
  const packetLossValue = Number(config?.packetLoss ?? 0);

  const bandwidthColor = getBandwidthColor(bandwidthValue);
  const isCritical = bandwidthValue < 30 && !config?.isOffline;

  const packetLossTrack = useMemo(() => {
    const max = 30;
    const pct = Math.max(0, Math.min(100, (packetLossValue / max) * 100));
    if (packetLossValue <= 0) return "#30363D";
    return `linear-gradient(to right, #EF4444 0%, #EF4444 ${pct}%, #30363D ${pct}%, #30363D 100%)`;
  }, [packetLossValue]);

  const bandwidthTrack = useMemo(() => {
    const pct = Math.max(0, Math.min(100, bandwidthValue));
    return `linear-gradient(to right, ${bandwidthColor} 0%, ${bandwidthColor} ${pct}%, #30363D ${pct}%, #30363D 100%)`;
  }, [bandwidthValue, bandwidthColor]);

  useEffect(() => {
    const id = setInterval(() => setUptimeSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setScenarioOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    };
  }, []);

  const deliveredValue = Number(stats?.delivered ?? 0);
  const queuedValue = Number(stats?.queued ?? 0);

  const delayBadge = getDelayBadge(selectedScenario?.ms);
  const queuedColor = queuedValue > 0 ? "#F59E0B" : "#6B7280";

  return (
    <div
      ref={panelRef}
      className={[
        "relative w-full rounded-lg bg-[#161B22] p-3 font-mono text-[#E8E8E8]",
        "border transition-colors duration-300",
        isCritical ? "border-[#EF4444]" : "border-[#30363D]",
      ].join(" ")}
    >
      {isCritical ? <div className="absolute left-0 top-0 h-1 w-full bg-[#EF4444]/60" /> : null}

      <style>{`
        @keyframes csDotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes csSlowPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.02); }
        }
        @keyframes csRestoreRipple {
          from { box-shadow: 0 0 0 0px rgba(16, 185, 129, 1); }
          to { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        }

        .cs-selectBtn { appearance: none; -webkit-appearance: none; -moz-appearance: none; }

        .cs-range { appearance: none; -webkit-appearance: none; width: 100%; background: transparent; }
        .cs-range:focus { outline: none; }

        .cs-range::-webkit-slider-runnable-track { height: 4px; border-radius: 9999px; background: var(--cs-track, #30363D); }
        .cs-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          margin-top: -5px;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 2px solid currentColor;
        }

        .cs-range::-moz-range-track { height: 4px; border-radius: 9999px; background: var(--cs-track, #30363D); }
        .cs-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 2px solid currentColor;
        }

        .cs-badgePulse { animation: csSlowPulse 1.6s ease-in-out infinite; }
        .cs-dotPulse { animation: csDotPulse 1s ease-in-out infinite; }
        .cs-restoreRipple { animation: csRestoreRipple 400ms ease-out; }
      `}</style>

      <div className="text-[10px] text-[#6B7280]">SCENARIO</div>
      <div className="relative mt-1">
        <button
          type="button"
          className={[
            "cs-selectBtn flex w-full items-center justify-between gap-2 rounded-md",
            "border border-[#30363D] bg-[#0D1117] px-2 py-1 text-left text-[12px]",
            "transition-colors hover:border-[#374151]",
          ].join(" ")}
          onClick={() => setScenarioOpen((o) => !o)}
          aria-expanded={scenarioOpen}
        >
          <span className="truncate">{sanitizeModeLabel(selectedScenario?.label || config?.mode || "—")}</span>
          <span
            className={["inline-flex items-center rounded px-1.5 py-0.5 text-[10px]", delayBadge.pulse ? "cs-badgePulse" : ""].join(" ")}
            style={{ background: delayBadge.bg, color: delayBadge.color }}
          >
            {delayBadge.text}
          </span>
        </button>

        {scenarioOpen ? (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-[#30363D] bg-[#0D1117] p-1 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            {DELAY_MODES.map((mode) => {
              const badge = getDelayBadge(mode.ms);
              const isSelected = Number(mode.ms) === Number(selectedScenario?.ms);
              return (
                <button
                  key={mode.ms}
                  type="button"
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-[12px]",
                    isSelected ? "bg-[#161B22]" : "hover:bg-[#161B22]",
                  ].join(" ")}
                  onClick={() => {
                    setScenarioOpen(false);
                    onDelayChange(Number(mode.ms));
                  }}
                >
                  <span className="truncate">{sanitizeModeLabel(mode.label)}</span>
                  <span
                    className={["inline-flex items-center rounded px-1.5 py-0.5 text-[10px]", badge.pulse ? "cs-badgePulse" : ""].join(" ")}
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.text}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-md border border-[#30363D] bg-[#0D1117] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-[#6B7280]">BANDWIDTH</div>
          <div className="text-[10px] text-[#6B7280]">0–100</div>
        </div>

        <div className="mt-2 flex flex-col items-center justify-center gap-2">
          <AnimatedCircularProgress size={80} strokeWidth={6} value={bandwidthValue} max={100} color={bandwidthColor} trackColor="#30363D">
            <div className="flex items-baseline justify-center font-mono text-[12px]" style={{ color: bandwidthColor }}>
              <NumberTicker
                value={bandwidthValue}
                direction="up"
                delay={0}
                className="font-mono text-[12px] text-[#E8E8E8] transition-colors duration-300"
                style={{ color: bandwidthColor }}
              />
              <span className="text-[#E8E8E8]">%</span>
            </div>
          </AnimatedCircularProgress>

          <div className="flex w-full items-center gap-2">
            <input
              className="cs-range"
              style={{ color: bandwidthColor, "--cs-track": bandwidthTrack }}
              type="range"
              min={0}
              max={100}
              step={1}
              value={bandwidthValue}
              onChange={(e) => onBandwidthChange(Number(e.target.value))}
              aria-label="Bandwidth"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-[#30363D] bg-[#0D1117] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-[#6B7280]">PACKET LOSS</div>
          <div className="flex items-center gap-1 text-[11px]">
            <NumberTicker
              value={packetLossValue}
              direction="up"
              delay={0}
              className="font-mono text-[11px] text-[#E8E8E8] transition-colors duration-300"
              style={{ color: packetLossValue > 0 ? "#EF4444" : "#E8E8E8" }}
            />
            <span className="text-[#E8E8E8]">%</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            className="cs-range"
            style={{ color: packetLossValue > 0 ? "#EF4444" : "#6B7280", "--cs-track": packetLossTrack }}
            type="range"
            min={0}
            max={30}
            step={1}
            value={packetLossValue}
            onChange={(e) => onPacketLossChange(Number(e.target.value))}
            aria-label="Packet loss"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={Boolean(config?.isOffline)}
          onClick={onDropConnection}
          className={[
            "rounded-md border px-2 py-2 text-[11px] transition-[box-shadow,opacity] duration-200",
            "bg-[#7F1D1D] text-[#FCA5A5] border-[#991B1B]",
            "hover:shadow-[0_0_0_2px_rgba(239,68,68,0.4)]",
            config?.isOffline ? "cursor-not-allowed opacity-70 hover:shadow-none" : "cursor-pointer",
          ].join(" ")}
        >
          {config?.isOffline ? (
            <span className="inline-flex items-center gap-2">
              <span className="cs-dotPulse">⬤</span>
              <span>LINK DOWN...</span>
            </span>
          ) : (
            "DROP LINK"
          )}
        </button>

        <button
          type="button"
          disabled={!config?.isOffline}
          onClick={() => {
            if (!config?.isOffline) return;
            onRestoreConnection();
            setRestoreRipple(true);
            if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
            rippleTimeoutRef.current = setTimeout(() => setRestoreRipple(false), 420);
          }}
          className={[
            "rounded-md border px-2 py-2 text-[11px] transition-[opacity] duration-200",
            "border-[#14532D] bg-[#0D1117] text-[#86EFAC]",
            config?.isOffline ? "cursor-pointer" : "cursor-not-allowed opacity-60",
            restoreRipple ? "cs-restoreRipple" : "",
          ].join(" ")}
        >
          RESTORE LINK
        </button>
      </div>

      <div className="mt-3 text-[12px] text-[#6B7280]">
        <span>SYS: {sanitizeModeLabel(config?.mode || "DEMO")}</span>
        <span> | </span>
        <span>UPTIME: {formatHMS(uptimeSeconds)}</span>
        <span> | </span>
        <span className="inline-flex items-center gap-1">
          <span>DELIVERED:</span>
          <NumberTicker
            value={deliveredValue}
            direction="up"
            delay={0}
            className="font-mono text-[12px] text-[#E8E8E8] transition-colors duration-300"
            style={{ color: "#10B981" }}
          />
        </span>
        <span> | </span>
        <span className="inline-flex items-center gap-1">
          <span>QUEUED:</span>
          <NumberTicker
            value={queuedValue}
            direction="up"
            delay={0}
            className="font-mono text-[12px] text-[#E8E8E8] transition-colors duration-300"
            style={{ color: queuedColor }}
          />
        </span>
      </div>
    </div>
  );
}

export default SimControlPanel;
