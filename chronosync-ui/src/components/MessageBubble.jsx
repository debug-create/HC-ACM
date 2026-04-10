import React, { useEffect, useRef, useState } from "react";
import { PRIORITIES, ROLES, STATUS_COLORS } from "../constants";

const ROLE_BORDER_COLORS = {
  FIELD_MEDIC: "#3B82F6",
  RESCUE_LEAD: "#10B981",
  SECTOR_COMMANDER: "#F59E0B",
  HQ_OPERATOR: "#8B5CF6",
};

function MessageBubble({ message, isOwnMessage }) {
  const [isAdvisoryExpanded, setIsAdvisoryExpanded] = useState(false);
  const outerRef = useRef(null);
  const isNew = useRef(
    message.id === "preset-1" || message.id === "preset-2" || message.id === "preset-3"
      ? false
      : true
  );

  useEffect(() => {
    if (isNew.current && outerRef.current) {
      if (message.status === "DELIVERED") {
        outerRef.current.classList.add("row-delivered-flash");
        const t = setTimeout(() => {
          outerRef.current?.classList.remove("row-delivered-flash");
        }, 300);
        return () => clearTimeout(t);
      }
    }
  }, [message.status]);

  const role = ROLES[message.sender_role] || ROLES.FIELD_MEDIC;
  const priority = PRIORITIES[message.priority] || PRIORITIES.STANDARD;
  const seq = `#${String(message.sequence_number).padStart(3, "0")}`;

  const statusConfig = {
    QUEUED: { bg: "#1C1917", color: "#78716C", text: "● QUEUED" },
    IN_TRANSIT: { bg: "#451A03", color: "#F59E0B", text: "◉ IN TRANSIT" },
    DELIVERED: { bg: "#14532D", color: "#86EFAC", text: "✓ DELIVERED" },
    CONFLICT: { bg: "#7F1D1D", color: "#FCA5A5", text: "⚠ STATE CONFLICT" },
  }[message.status] || { bg: "#1C1917", color: STATUS_COLORS.QUEUED, text: message.status };

  const priorityText =
    message.priority === "HIGH" ? "● HIGH" : message.priority === "INFO" ? "INFO" : "STANDARD";

  const borderColor = ROLE_BORDER_COLORS[message.sender_role] || "#3B82F6";

  let containerClass = "";
  if (message.status === "CONFLICT") {
    containerClass = "row-conflict-flash";
  }

  return (
    <div
      ref={outerRef}
      className={containerClass}
      style={{
        position: "relative",
        background: message.status === "CONFLICT" ? "#1A0A0A" : "#161B22",
        borderRadius: 6,
        padding: "10px 12px",
        borderLeft: message.status !== "CONFLICT" ? `2px solid ${borderColor}` : undefined,
        marginBottom: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            background: role.bg,
            color: role.color,
            padding: "1px 6px",
            borderRadius: 3,
            fontSize: 10,
            fontFamily: "monospace",
          }}
        >
          {role.label}
        </span>
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>{seq}</span>
        <span
          style={{
            background: priority.bg,
            color: priority.color,
            padding: "1px 5px",
            borderRadius: 3,
            fontSize: 9,
            fontFamily: "monospace",
          }}
        >
          {priorityText}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>
          {new Date(message.sent_at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}{" "}
          IST
        </span>
        <span
          style={{
            background: statusConfig.bg,
            color: statusConfig.color,
            padding: "1px 7px",
            borderRadius: 3,
            fontSize: 10,
            fontFamily: "monospace",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {message.status === "IN_TRANSIT" && <span className="transit-pulse-dot-new" />}
          {statusConfig.text}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "#E8E8E8", lineHeight: 1.6, paddingLeft: 4, marginTop: 4 }}>
        {message.content}
      </div>

      {message.status === "CONFLICT" && (
        <div
          className="conflict-banner-slide"
          style={{
            background: "#450A0A",
            color: "#FCA5A5",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            borderLeft: "4px solid #EF4444",
          }}
        >
          STATE CONFLICT — Msg {seq} vs #{message.conflict_with || "Y"} — Human resolution required
        </div>
      )}

      {isOwnMessage && message.sender_side === "FIELD" && message.advisoryStatus && (
        <div style={{ marginTop: 8 }}>
          <div
            onClick={() => setIsAdvisoryExpanded((v) => !v)}
            style={{
              background: "#0D1B2A",
              borderLeft: "3px solid #3B82F6",
              borderRadius: isAdvisoryExpanded ? "0 4px 0 0" : "0 4px 4px 0",
              padding: "6px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#93C5FD", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                ICS PROTOCOL ADVISORY
              </span>
            </div>
            <div>
              <span style={{ fontSize: 10, color: "#4B5563" }}>{isAdvisoryExpanded ? "▲" : "▼"}</span>
            </div>
          </div>

          {isAdvisoryExpanded && (
            <div
              style={{
                background: "#0A1520",
                borderLeft: "3px solid #1D4ED8",
                borderRadius: "0 0 4px 0",
                padding: "8px 10px",
              }}
            >
              {message.advisoryStatus === "loading" && (
                <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>
                  Querying ICS protocol database
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </div>
              )}
              {message.advisoryStatus === "loaded" && (
                <div className="advisory-reveal">
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "#60A5FA", fontFamily: "monospace", marginBottom: 2 }}>FIELD AUTHORITY</span>
                    <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>{message.advisoryAuthority || "Awaiting authorization..."}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "#60A5FA", fontFamily: "monospace", marginBottom: 2 }}>PROTOCOL REF</span>
                    <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>{message.advisoryProtocol || "Referencing docs..."}</span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: "#60A5FA", fontFamily: "monospace", marginBottom: 2 }}>RISK FLAG</span>
                    <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>{message.advisoryRisk || "Assessing risk profile..."}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;

