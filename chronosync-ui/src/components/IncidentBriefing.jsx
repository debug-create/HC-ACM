import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

const FIELD_MARKER = { location: [30.3165, 78.0322], label: "EPICENTER", sub: "UTTARAKHAND, IN" };
const HQ_MARKER = { location: [28.6139, 77.209], label: "NDRF HQ", sub: "NEW DELHI, IN" };

export default function IncidentBriefing({ onComplete }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("alert");
  // phases: "alert" → "locating" → "ready"
  const phiRef = useRef(0);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("locating"), 2200);
    const t2 = setTimeout(() => setPhase("ready"), 4800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Globe setup
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe = null;
    let raf = null;

    function init() {
      const w = canvas.offsetWidth;
      if (!w) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: w,
        height: w,
        phi: 2.4,
        theta: 0.3,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 20000,
        mapBrightness: 5,
        baseColor: [0.05, 0.12, 0.08],
        markerColor: [0.98, 0.37, 0.04],
        glowColor: [0.06, 0.18, 0.1],
        markers: [
          { location: FIELD_MARKER.location, size: 0.07 },
          { location: HQ_MARKER.location, size: 0.04 },
        ],
        opacity: 0.92,
      });

      function animate() {
        phiRef.current += 0.003;
        globe.update({ phi: phiRef.current, theta: 0.3 });
        raf = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      }, 100);
    }

    if (canvas.offsetWidth > 0) init();
    else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (globe) globe.destroy();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#020804",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      {/* Scanline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner accents */}
      {[
        { top: 16, left: 16, borderTop: "1px solid #10B981", borderLeft: "1px solid #10B981" },
        { top: 16, right: 16, borderTop: "1px solid #10B981", borderRight: "1px solid #10B981" },
        { bottom: 16, left: 16, borderBottom: "1px solid #10B981", borderLeft: "1px solid #10B981" },
        { bottom: 16, right: 16, borderBottom: "1px solid #10B981", borderRight: "1px solid #10B981" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 24, height: 24, zIndex: 2, ...s }} />
      ))}

      {/* ALERT HEADER */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderBottom: "1px solid rgba(239,68,68,0.4)",
          background: "rgba(2,8,4,0.9)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#EF4444",
              boxShadow: "0 0 8px #EF4444",
              animation: "statusPulse 0.8s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 11, color: "#EF4444", letterSpacing: "0.2em" }}>
            SEISMIC EVENT — SEVERITY CRITICAL
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#4B5563", letterSpacing: "0.1em" }}>
          {new Date().toUTCString().toUpperCase()}
        </span>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 60,
          maxWidth: 1100,
          width: "100%",
          padding: "0 48px",
        }}
      >
        {/* LEFT — Globe */}
        <div style={{ flexShrink: 0, width: 420, height: 420, position: "relative" }}>
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              opacity: 0,
              transition: "opacity 1.5s ease",
            }}
          />
          {/* Pulsing ring around globe */}
          <div
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              border: "1px solid rgba(16,185,129,0.2)",
              animation: "ping-ring 3s ease-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              border: "1px solid rgba(16,185,129,0.08)",
              animation: "ping-ring 3s ease-out infinite",
              animationDelay: "1s",
              pointerEvents: "none",
            }}
          />

          {/* Marker labels on globe */}
          <div
            style={{
              position: "absolute",
              top: "18%",
              right: "8%",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.5)",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 9,
              color: "#FCA5A5",
              letterSpacing: "0.1em",
            }}
          >
            ⚠ {FIELD_MARKER.label}
            <div style={{ fontSize: 8, color: "#6B7280", marginTop: 1 }}>{FIELD_MARKER.sub}</div>
          </div>
          <div
            style={{
              position: "absolute",
              top: "28%",
              right: "12%",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 9,
              color: "#86EFAC",
              letterSpacing: "0.1em",
              opacity: phase === "alert" ? 0 : 1,
              transition: "opacity 0.8s",
            }}
          >
            ● {HQ_MARKER.label}
            <div style={{ fontSize: 8, color: "#6B7280", marginTop: 1 }}>{HQ_MARKER.sub}</div>
          </div>
        </div>

        {/* RIGHT — Incident brief */}
        <div style={{ flex: 1 }}>
          {/* Classification tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 3,
              padding: "3px 10px",
              marginBottom: 16,
              fontSize: 9,
              color: "#FCA5A5",
              letterSpacing: "0.2em",
            }}
          >
            INCIDENT CLASSIFICATION: ALPHA-1
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: "#E8E8E8",
              letterSpacing: "0.08em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            EARTHQUAKE
            <br />
            <span style={{ color: "#10B981" }}>RESPONSE</span>
            <br />
            OPERATION
          </h1>

          {/* Decorative line */}
          <div
            style={{
              width: 60,
              height: 2,
              background: "linear-gradient(90deg, #10B981, transparent)",
              marginBottom: 20,
            }}
          />

          {/* Data grid */}
          {[
            { label: "MAGNITUDE", value: "6.8 Mw" },
            { label: "EPICENTER", value: "UTTARAKHAND — 30.31°N 78.03°E" },
            { label: "DEPTH", value: "12 KM" },
            { label: "AFFECTED RADIUS", value: "~85 KM" },
            { label: "COMM DELAY", value: "HIGH LATENCY — SATELLITE UPLINK" },
            { label: "TEAMS DEPLOYED", value: "NDRF UNIT 4 — GRID SECTOR 4" },
          ].map(({ label, value }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                opacity: phase === "alert" && i > 1 ? 0 : 1,
                transform: phase === "alert" && i > 1 ? "translateX(-8px)" : "translateX(0)",
                transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s`,
              }}
            >
              <span style={{ fontSize: 10, color: "#4B5563", minWidth: 140, letterSpacing: "0.1em" }}>{label}</span>
              <span style={{ fontSize: 11, color: "#E8E8E8", letterSpacing: "0.05em" }}>{value}</span>
            </div>
          ))}

          {/* Status line */}
          <div
            style={{
              marginTop: 16,
              marginBottom: 24,
              fontSize: 11,
              color: "#F59E0B",
              letterSpacing: "0.1em",
              opacity: phase === "ready" ? 1 : 0,
              transition: "opacity 0.6s",
            }}
          >
            {phase === "ready" ? (
              <>◉ COMMS LINK AVAILABLE — HIGH LATENCY CONDITIONS DETECTED</>
            ) : (
              <>◌ ESTABLISHING SATELLITE UPLINK...</>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={onComplete}
            disabled={phase !== "ready"}
            style={{
              padding: "12px 32px",
              background: phase === "ready" ? "#14532D" : "#1C2128",
              color: phase === "ready" ? "#86EFAC" : "#4B5563",
              border: phase === "ready" ? "1px solid #15803D" : "1px solid #374151",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              cursor: phase === "ready" ? "pointer" : "not-allowed",
              transition: "all 0.4s",
              boxShadow: phase === "ready" ? "0 0 20px rgba(16,185,129,0.2)" : "none",
            }}
          >
            {phase === "ready" ? "▶ ESTABLISH COMMS LINK" : "INITIALIZING..."}
          </button>

          {/* Skip for demo */}
          <div
            onClick={onComplete}
            style={{
              marginTop: 10,
              fontSize: 9,
              color: "#374151",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            skip intro →
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderTop: "1px solid rgba(16,185,129,0.15)",
          background: "rgba(2,8,4,0.9)",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 24, fontSize: 9, color: "#4B5563", letterSpacing: "0.1em" }}>
          <span>CHRONOSYNC v1.0</span>
          <span>NDRF TACTICAL COMMS</span>
          <span>CLASSIFICATION: ACTIVE OPS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: "#4B5563" }}>
          {["", "", ""].map((_, i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#10B981",
                opacity: 0.3 + i * 0.3,
                animation: `statusPulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                display: "inline-block",
              }}
            />
          ))}
          <span>SYSTEM ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
