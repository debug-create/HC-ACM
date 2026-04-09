import React, { useEffect, useState } from "react";

function TransitMap({ networkConfig, inTransitMessages, queuedMessages, fieldMsgCount, hqMsgCount }) {
  const [tick, setTick] = useState(0);
  void tick;

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const delayLabel =
    networkConfig.delay_ms >= 60000
      ? `${Math.floor(networkConfig.delay_ms / 60000)}m`
      : `${networkConfig.delay_ms / 1000}s`;

  const bwColor =
    networkConfig.bandwidth > 60 ? "#10B981" : networkConfig.bandwidth > 30 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
        <div
          style={{
            position: "relative",
            background: "#0F2419",
            border: "1px solid #10B981",
            borderRadius: 6,
            padding: "6px 10px",
            flexShrink: 0,
          }}
        >
          {fieldMsgCount > 2 && (
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "#10B981",
                color: "#0F2419",
                borderRadius: "50%",
                width: 16,
                height: 16,
                fontSize: 9,
                fontFamily: "monospace",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {fieldMsgCount}
            </div>
          )}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span
              className={!networkConfig.isOffline ? "node-online" : ""}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: networkConfig.isOffline ? "#EF4444" : "#10B981",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#10B981", fontFamily: "monospace", fontWeight: 500 }}>
              FIELD TEAM
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#4B5563", fontFamily: "monospace" }}>GRID 4 — 28.6°N</div>
        </div>

        <div style={{ flex: 1, position: "relative", height: 28, margin: "0 8px" }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              width: "100%",
              height: 2,
              background: networkConfig.isOffline ? "#374151" : bwColor,
            }}
          />

          <div
            className={inTransitMessages.length > 0 ? "transit-label-pulse" : ""}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 3,
              padding: "2px 8px",
              fontSize: 10,
              color: "#9CA3AF",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
            }}
          >
            ◄ FIELD — {delayLabel} — HQ ►
          </div>

          {inTransitMessages.map((message) => {
            const progress = Math.min(
              1,
              Math.max(0, (Date.now() - Date.parse(message.sent_at)) / Math.max(1, networkConfig.delay_ms))
            );
            const leftPercent = message.direction === "FIELD_TO_HQ" ? progress * 100 : (1 - progress) * 100;
            const color =
              message.priority === "HIGH" ? "#EF4444" : message.priority === "STANDARD" ? "#F59E0B" : "#3B82F6";

            return (
              <div
                key={message.id}
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: `${leftPercent}%`,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  transition: "left 150ms linear",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 8,
                    color: "#9CA3AF",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{String(message.sequence_number).padStart(3, "0")}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "relative",
            background: "#0F2419",
            border: `1px solid ${networkConfig.isOffline ? "#EF4444" : "#10B981"}`,
            borderRadius: 6,
            padding: "6px 10px",
            flexShrink: 0,
          }}
        >
          {hqMsgCount > 2 && (
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "#10B981",
                color: "#0F2419",
                borderRadius: "50%",
                width: 16,
                height: 16,
                fontSize: 9,
                fontFamily: "monospace",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hqMsgCount}
            </div>
          )}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span
              className={!networkConfig.isOffline ? "node-online" : ""}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: networkConfig.isOffline ? "#EF4444" : "#10B981",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#10B981", fontFamily: "monospace", fontWeight: 500 }}>
              HQ — INC CMD
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#4B5563", fontFamily: "monospace" }}>CONTROL CENTER</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>
        BW: <span style={{ color: bwColor }}>{networkConfig.bandwidth}%</span> | LOSS: {networkConfig.packetLoss}% |
        QUEUE: {queuedMessages.length} | IN TRANSIT: {inTransitMessages.length}
      </div>

      {networkConfig.bandwidth < 30 && !networkConfig.isOffline && (
        <div
          style={{
            background: "#451A03",
            color: "#FCD34D",
            fontSize: 10,
            fontFamily: "monospace",
            padding: "3px 8px",
            borderRadius: 3,
            marginTop: 4,
          }}
        >
          ⚡ CRITICAL-ONLY MODE ACTIVE
        </div>
      )}
    </div>
  );
}

export default TransitMap;
