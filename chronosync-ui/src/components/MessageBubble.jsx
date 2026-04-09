import React, { useEffect, useRef, useState } from "react";
import { PRIORITIES, ROLES, STATUS_COLORS } from "../constants";

function MessageBubble({ message, isOwnMessage }) {
  const [isAdvisoryExpanded, setIsAdvisoryExpanded] = useState(
    message.id === "preset-1" ||
      message.id === "preset-3" ||
      message.advisoryStatus === "loading"
  );
  const outerRef = useRef(null);
  const isNew = useRef(
    message.status !== "DELIVERED" || message.id === "preset-1" || message.id === "preset-2" || message.id === "preset-3"
      ? false
      : true
  );

  useEffect(() => {
    if (isNew.current && outerRef.current) {
      outerRef.current.classList.add("message-arriving");
      const t = setTimeout(() => {
        outerRef.current?.classList.remove("message-arriving");
      }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  const role = ROLES[message.sender_role] || ROLES.FIELD_MEDIC;
  const priority = PRIORITIES[message.priority] || PRIORITIES.STANDARD;
  const seq = `#${String(message.sequence_number).padStart(3, "0")}`;

  const statusConfig = {
    QUEUED: { bg: "#1C1917", color: "#78716C", text: "● QUEUED" },
    IN_TRANSIT: { bg: "#451A03", color: "#F59E0B", text: "◉ IN TRANSIT" },
    DELIVERED: { bg: "#14532D", color: "#86EFAC", text: "✓ DELIVERED" },
    CONFLICT: { bg: "#7F1D1D", color: "#FCA5A5", text: "⚠ CONFLICT" },
  }[message.status] || { bg: "#1C1917", color: STATUS_COLORS.QUEUED, text: message.status };

  const priorityText =
    message.priority === "HIGH" ? "● HIGH" : message.priority === "INFO" ? "INFO" : "STANDARD";

  return (
    <div
      ref={outerRef}
      style={{
        position: "relative",
        background: message.status === "CONFLICT" ? "#1A0A0A" : "#161B22",
        borderRadius: 6,
        padding: "10px 12px",
        borderLeft: `4px solid ${role.color}`,
        marginBottom: 2,
        border: message.status === "CONFLICT" ? "1px solid #EF4444" : "1px solid transparent",
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
          {message.status === "IN_TRANSIT" && <span className="status-pulse-dot" />}
          {statusConfig.text}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "#E8E8E8", lineHeight: 1.6, paddingLeft: 4, marginTop: 4 }}>
        {message.content}
      </div>

      {message.status === "CONFLICT" && (
        <div
          style={{
            marginTop: 8,
            background: "#450A0A",
            color: "#FCA5A5",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          STATE CONFLICT — Msg #{message.sequence_number} references contradictory field state. Human resolution
          required.
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L20 5V11C20 16 16.8 20.5 12 22C7.2 20.5 4 16 4 11V5L12 2Z" stroke="#60A5FA" strokeWidth="1.5" />
              </svg>
              <span style={{ fontSize: 10, color: "#93C5FD", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                ICS PROTOCOL ADVISORY
              </span>
            </div>
            <div>
              {message.advisoryStatus === "loading" && <span className="advisory-spinner" />}
              {message.advisoryStatus === "loaded" && (
                <span style={{ fontSize: 10, color: "#4B5563" }}>{isAdvisoryExpanded ? "▲" : "▼"}</span>
              )}
              {message.advisoryStatus === "error" && <span style={{ color: "#EF4444" }}>⚠</span>}
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
                <div style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>
                  {message.advisoryText}
                </div>
              )}
              <div style={{ fontSize: 10, color: "#374151", fontStyle: "italic", marginTop: 8 }}>
                AI-generated from emergency protocols. Not a command decision.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
