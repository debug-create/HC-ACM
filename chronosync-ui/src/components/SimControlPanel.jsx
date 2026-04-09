import React from "react";
import { DELAY_MODES } from "../constants";

function SimControlPanel({ networkConfig, stats, onUpdateConfig, onToggleLink, onReset }) {
  const bwColor =
    networkConfig.bandwidth > 60 ? "#10B981" : networkConfig.bandwidth > 30 ? "#F59E0B" : "#EF4444";
  const lossColor =
    networkConfig.packetLoss === 0 ? "#10B981" : networkConfig.packetLoss < 10 ? "#F59E0B" : "#EF4444";

  const modePreview = (networkConfig.mode || "DEMO").split(" ")[0];

  return (
    <div
      style={{
        width: "40%",
        background: "#161B22",
        border: "1px solid #21262D",
        borderLeft: "3px solid #F59E0B",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace", marginBottom: 3 }}>SCENARIO</div>
      <select
        value={networkConfig.mode}
        onChange={(e) => {
          const selectedMode = DELAY_MODES.find((m) => m.label === e.target.value) || DELAY_MODES[0];
          onUpdateConfig({ delay_ms: selectedMode.ms, mode: selectedMode.label });
        }}
        style={{
          width: "100%",
          background: "#0D1117",
          color: "#E8E8E8",
          border: "1px solid #374151",
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        {DELAY_MODES.map((mode) => (
          <option key={mode.ms} value={mode.label}>
            {mode.label}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 40, fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>BW</div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={networkConfig.bandwidth}
          onChange={(e) => {
            const value = Number(e.target.value);
            onUpdateConfig({ bandwidth: value, bandwidth_pct: value });
          }}
        />
        <div style={{ minWidth: 36, fontSize: 11, fontFamily: "monospace", color: bwColor }}>
          {networkConfig.bandwidth}%
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 40, fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>PKT LOSS</div>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={networkConfig.packetLoss}
          onChange={(e) => {
            const value = Number(e.target.value);
            onUpdateConfig({ packetLoss: value, packet_loss_pct: value });
          }}
        />
        <div style={{ minWidth: 36, fontSize: 11, fontFamily: "monospace", color: lossColor }}>
          {networkConfig.packetLoss}%
        </div>
      </div>

      <button
        onClick={onToggleLink}
        style={{
          width: "100%",
          marginTop: 8,
          padding: 6,
          borderRadius: 4,
          fontSize: 11,
          fontFamily: "monospace",
          cursor: "pointer",
          border: networkConfig.isOffline ? "1px solid #15803D" : "1px solid #991B1B",
          background: networkConfig.isOffline ? "#14532D" : "#7F1D1D",
          color: networkConfig.isOffline ? "#86EFAC" : "#FCA5A5",
        }}
      >
        {networkConfig.isOffline ? "RESTORE LINK" : "DROP LINK"}
      </button>

      <button
        type="button"
        onClick={onReset}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "5px 0",
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "monospace",
          cursor: "pointer",
          border: "1px solid #374151",
          background: "#161B22",
          color: "#6B7280",
        }}
      >
        ↺ RESET DEMO
      </button>

      <div style={{ marginTop: 8, fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>
        SYS: {modePreview} | UP: {stats.uptime} | MSGS: {stats.delivered} | QUEUED: {stats.queued}
      </div>
    </div>
  );
}

export default SimControlPanel;
