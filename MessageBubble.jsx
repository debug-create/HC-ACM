import { useState, useEffect } from "react";
import ProtocolAdvisoryPanel from "@/components/ProtocolAdvisoryPanel";

const sampleAdvisory = {
  field_authority: "Incident Commander — Division Alpha, Sector 3",
  protocol_ref: "ICS-209 / FEMA NRF ESF-4 (Firefighting), Annex Q",
  risk_flag: "Structural collapse risk elevated. Evacuate adjacent grid squares before suppression.",
  generated_at: "2026-04-09T14:32:07Z",
};

const Index = () => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setStatus("loaded"), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ background: "#0A1628" }}>
      {/* Fake sent message */}
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ background: "#1E3A5F", color: "#E2E8F0", borderRadius: 8, padding: "10px 14px", fontSize: 14 }}>
          What ICS protocols apply to the warehouse fire at grid ref 34N-12E?
        </div>

        <ProtocolAdvisoryPanel
          status={status}
          advisory={status === "loaded" ? sampleAdvisory : null}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((v) => !v)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setStatus("loading"); setTimeout(() => setStatus("loaded"), 2500); }}
          style={{ background: "#3B82F6", color: "#fff", padding: "6px 16px", borderRadius: 6, fontSize: 13 }}
        >
          Replay loading → loaded
        </button>
        <button
          onClick={() => setStatus("error")}
          style={{ background: "#EF4444", color: "#fff", padding: "6px 16px", borderRadius: 6, fontSize: 13 }}
        >
          Show error
        </button>
      </div>
    </div>
  );
};

export default Index;
