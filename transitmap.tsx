import { useState, useEffect } from "react";
import TransitMap from "@/components/TransitMap";

const Index = () => {
  const [bandwidth, setBandwidth] = useState(75);
  const [messages, setMessages] = useState([
    { id: "m1", sequence_number: 42, direction: "FIELD_TO_HQ" as const, priority: "HIGH" as const, progress: 0.2 },
    { id: "m2", sequence_number: 43, direction: "FIELD_TO_HQ" as const, priority: "STANDARD" as const, progress: 0.6 },
    { id: "m3", sequence_number: 44, direction: "HQ_TO_FIELD" as const, priority: "INFO" as const, progress: 0.4 },
  ]);

  // Animate blip progress
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          progress: m.progress >= 1 ? 0 : m.progress + 0.005,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ background: "#0a0b0f" }}>
      <h1 style={{ color: "#E5E7EB", fontFamily: "monospace", fontSize: 14, letterSpacing: 4, textTransform: "uppercase", opacity: 0.6 }}>
        Disaster Response Comm Dashboard
      </h1>
      <div className="w-full max-w-4xl">
        <TransitMap
          networkState={{ bandwidth, packetLoss: 2, delay_ms: 1200, mode: "normal", isOffline: false }}
          inTransitMessages={messages}
          queueDepth={3}
        />
      </div>
      <div className="flex gap-3 mt-4">
        {[85, 45, 20, 0].map((bw) => (
          <button
            key={bw}
            onClick={() => setBandwidth(bw)}
            className="px-3 py-1 rounded text-xs font-mono"
            style={{
              background: bandwidth === bw ? "#1F2937" : "transparent",
              color: "#9CA3AF",
              border: "1px solid #374151",
            }}
          >
            {bw === 0 ? "Offline" : `BW: ${bw}%`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
