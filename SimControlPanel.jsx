import { useState, useEffect, useCallback, useRef } from "react";
import SimControlPanel from "@/components/SimControlPanel";
import MessageQueueVisualization, { type QueueMessage } from "@/components/MessageQueueVisualization";
import { playHighPriorityAlert, playConnectionDropAlert, playConnectionRestoreAlert } from "@/lib/audioAlerts";

const MESSAGE_LABELS = [
  "EVAC-ROUTE-UPDATE",
  "SHELTER-STATUS-RPT",
  "MED-SUPPLY-REQ",
  "WEATHER-ALERT",
  "PERSONNEL-LOCATOR",
  "INFRA-DAMAGE-RPT",
  "COMMS-CHECK",
  "RESOURCE-DISPATCH",
  "CASUALTY-RPT",
  "WATER-LEVEL-DATA",
  "SAR-TEAM-COORD",
  "POWER-GRID-STATUS",
];

const PRIORITIES: Array<"high" | "normal" | "low"> = ["high", "normal", "low"];

let msgCounter = 0;

const Index = () => {
  const [config, setConfig] = useState({
    delay_ms: 8000,
    bandwidth: 100,
    packetLoss: 0,
    mode: "DEMO — 8 SEC",
    isOffline: false,
  });

  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [delivered, setDelivered] = useState(0);
  const [startTime] = useState(Date.now());
  const [uptime, setUptime] = useState("00:00:00");
  const configRef = useRef(config);
  configRef.current = config;

  // Uptime ticker
  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${sec}`);
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // Generate messages
  useEffect(() => {
    const id = setInterval(() => {
      const label = MESSAGE_LABELS[Math.floor(Math.random() * MESSAGE_LABELS.length)];
      const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      msgCounter++;
      if (priority === "high") {
        playHighPriorityAlert();
      }
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            id: `msg-${msgCounter}`,
            label,
            status: "queued" as const,
            priority,
            timestamp: ts,
            size: Math.floor(Math.random() * 900) + 100,
          },
        ];
        return next.slice(-30);
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Process queue
  useEffect(() => {
    const id = setInterval(() => {
      const c = configRef.current;
      if (c.isOffline) return;

      setMessages((prev) => {
        const updated = [...prev];
        // Move one queued → sending
        const qi = updated.findIndex((m) => m.status === "queued");
        if (qi !== -1) {
          // packet loss check
          if (Math.random() * 100 < c.packetLoss) {
            updated[qi] = { ...updated[qi], status: "failed" };
          } else {
            updated[qi] = { ...updated[qi], status: "sending" };
          }
        }
        // Move one sending → delivered
        const si = updated.findIndex((m) => m.status === "sending");
        if (si !== -1) {
          updated[si] = { ...updated[si], status: "delivered" };
          setDelivered((d) => d + 1);
        }
        return updated;
      });
    }, Math.max(300, 1500 - config.bandwidth * 10));
    return () => clearInterval(id);
  }, [config.bandwidth, config.isOffline]);

  const queued = messages.filter((m) => m.status === "queued" || m.status === "sending").length;

  return (
    <div style={{ background: "#0D1117", minHeight: "100vh", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#58A6FF", marginBottom: 4, letterSpacing: 1 }}>
        ◆ DISASTER RESPONSE COMMS — CONTROL INTERFACE
      </div>
      <SimControlPanel
        config={config}
        stats={{ uptime, delivered, queued }}
        onDelayChange={(ms) => {
          const label = [
            { ms: 8000, l: "DEMO — 8 SEC" },
            { ms: 90000, l: "DEGRADED NETWORK — 90 SEC" },
            { ms: 300000, l: "DEEP FIELD — 5 MIN" },
            { ms: 1200000, l: "FULL SATELLITE DELAY — 20 MIN" },
          ].find((s) => s.ms === ms);
          setConfig((c) => ({ ...c, delay_ms: ms, mode: label?.l ?? c.mode }));
        }}
        onBandwidthChange={(pct) => setConfig((c) => ({ ...c, bandwidth: pct }))}
        onPacketLossChange={(pct) => setConfig((c) => ({ ...c, packetLoss: pct }))}
        onDropConnection={() => { playConnectionDropAlert(); setConfig((c) => ({ ...c, isOffline: true })); }}
        onRestoreConnection={() => { playConnectionRestoreAlert(); setConfig((c) => ({ ...c, isOffline: false })); }}
      />
      <MessageQueueVisualization
        messages={messages}
        isOffline={config.isOffline}
        bandwidth={config.bandwidth}
      />
    </div>
  );
};

export default Index;
