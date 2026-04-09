import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import IncidentBriefing from "./components/IncidentBriefing";
import MessageBubble from "./components/MessageBubble";
import SimControlPanel from "./components/SimControlPanel";
import TaskBoard from "./components/TaskBoard";
import TransitMap from "./components/TransitMap";
import { API_URL, WS_URL } from "./constants";

const PRESET_FIELD_MSG = {
  id: "preset-1",
  sequence_number: 1,
  sender_role: "RESCUE_LEAD",
  sender_side: "FIELD",
  content:
    "Block C has partial collapse on floors 2-3. 4 critical casualties confirmed. Requesting structural clearance for extraction. Over.",
  priority: "STANDARD",
  sent_at: new Date(Date.now() - 120000).toISOString(),
  deliver_at: new Date(Date.now() - 112000).toISOString(),
  status: "DELIVERED",
  advisoryStatus: "loaded",
  advisoryText:
    "FIELD AUTHORITY: Rescue Lead is authorized to conduct visual structural assessment from safe perimeter under ICS Field Ops delegation. No HQ approval needed for observation-only activity.\n\nPROTOCOL REF: ICS 300 §4.2 — Partial collapse extraction requires certified structural evaluation before entry. Field commander must document hazard assessment prior to personnel deployment.\n\nRISK FLAG: Secondary collapse probability is elevated within first 6 hours post-event. Aftershock risk is HIGH. Maintain 15m exclusion zone around unstable structure until structural team clears entry.",
};

const PRESET_HQ_MSG = {
  id: "preset-2",
  sequence_number: 2,
  sender_role: "HQ_OPERATOR",
  sender_side: "HQ",
  content:
    "Copy that. Do NOT begin extraction until structural team confirms load bearing integrity. Medical airlift ETA 18 minutes. Stand by.",
  priority: "HIGH",
  sent_at: new Date(Date.now() - 110000).toISOString(),
  deliver_at: new Date(Date.now() - 102000).toISOString(),
  status: "DELIVERED",
  advisoryStatus: null,
  advisoryText: null,
};

const PRESET_FIELD_MSG_2 = {
  id: "preset-3",
  sequence_number: 3,
  sender_role: "FIELD_MEDIC",
  sender_side: "FIELD",
  content:
    "Sector 1 triage complete. 2 critical requiring immediate surgical intervention. Requesting medical priority upgrade. Over.",
  priority: "HIGH",
  sent_at: new Date(Date.now() - 60000).toISOString(),
  deliver_at: new Date(Date.now() - 52000).toISOString(),
  status: "DELIVERED",
  advisoryStatus: "loaded",
  advisoryText:
    "FIELD AUTHORITY: Field Medic authorized to classify casualty priority under ICS Medical Branch without HQ approval.\n\nPROTOCOL REF: NDRF Medical SOP §3.1 — Critical casualties requiring surgical intervention must be flagged Priority-1. Field Medic has authority to request airlift upgrade.\n\nRISK FLAG: Priority-1 airlift requests require LZ clearance confirmation. Ensure landing zone is marked and secured before airlift ETA.",
};

const PRESET_TASKS = [
  {
    id: "task-1",
    category: "STRUCTURAL",
    description: "Block C structural assessment",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
  {
    id: "task-2",
    category: "STRUCTURAL",
    description: "Entry point B cleared for access",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
  {
    id: "task-3",
    category: "MEDICAL",
    description: "Sector 1 triage complete",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
  {
    id: "task-4",
    category: "MEDICAL",
    description: "Medical airlift requested",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
  {
    id: "task-5",
    category: "COORDINATION",
    description: "Secondary team deployed to Grid 4",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
  {
    id: "task-6",
    category: "COMMAND",
    description: "Evacuation order acknowledged by HQ",
    field_status: "PENDING",
    hq_status: "UNKNOWN",
    sync_state: "LOCAL_ONLY",
    field_updated_at: null,
    hq_synced_at: null,
  },
];

function playDeliveryTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 520;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // no-op
  }
}

function App() {
  const [showBriefing, setShowBriefing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [fieldMessages, setFieldMessages] = useState([PRESET_FIELD_MSG, PRESET_FIELD_MSG_2]);
  const [hqMessages, setHqMessages] = useState([PRESET_FIELD_MSG, PRESET_HQ_MSG, PRESET_FIELD_MSG_2]);
  const [inTransitMessages, setInTransitMessages] = useState([]);
  const [tasks, setTasks] = useState(PRESET_TASKS);
  const [networkConfig, setNetworkConfig] = useState({
    delay_ms: 8000,
    bandwidth: 100,
    packetLoss: 0,
    mode: "DEMO — 8 SEC",
    isOffline: false,
  });
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [stats, setStats] = useState({ delivered: 0, queued: 0, uptime: "00:00:00" });

  const [fieldInput, setFieldInput] = useState("");
  const [hqInput, setHqInput] = useState("");
  const [hqRole, setHqRole] = useState("HQ_OPERATOR");
  const [hqPriority, setHqPriority] = useState("STANDARD");
  const [fieldRole, setFieldRole] = useState("RESCUE_LEAD");
  const [fieldPriority, setFieldPriority] = useState("STANDARD");

  const seqRef = useRef(3);
  const startedAtRef = useRef(Date.now());
  const fieldScrollRef = useRef(null);
  const hqScrollRef = useRef(null);
  const wsRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);
  const wsAllowReconnectRef = useRef(true);

  const delayLabel =
    networkConfig.delay_ms >= 60000
      ? Math.floor(networkConfig.delay_ms / 60000) + "m"
      : networkConfig.delay_ms / 1000 + "s";

  useEffect(() => {
    if (showBriefing) return;
    setShowSplash(true);
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, [showBriefing]);

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const h = String(Math.floor(elapsed / 3600000)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
      setStats((prev) => ({ ...prev, uptime: `${h}:${m}:${s}` }));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    setStats((prev) => ({ ...prev, queued: queuedMessages.length }));
  }, [queuedMessages.length]);

  useEffect(() => {
    document.title =
      inTransitMessages.length > 0
        ? `[${inTransitMessages.length} IN TRANSIT] CHRONOSYNC`
        : "CHRONOSYNC — FIELD OPS CONSOLE";
  }, [inTransitMessages.length]);

  useEffect(() => {
    if (fieldScrollRef.current) {
      fieldScrollRef.current.scrollTop = fieldScrollRef.current.scrollHeight;
    }
  }, [fieldMessages]);

  useEffect(() => {
    if (hqScrollRef.current) {
      hqScrollRef.current.scrollTop = hqScrollRef.current.scrollHeight;
    }
  }, [hqMessages]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch(`${API_URL}/state`);
        if (!response.ok) return;
        const data = await response.json();
        if (data?.networkConfig) {
          setNetworkConfig((prev) => ({
            ...prev,
            delay_ms: data.networkConfig.delay_ms ?? prev.delay_ms,
            bandwidth: data.networkConfig.bandwidth ?? data.networkConfig.bandwidth_pct ?? prev.bandwidth,
            packetLoss: data.networkConfig.packetLoss ?? data.networkConfig.packet_loss_pct ?? prev.packetLoss,
            mode: data.networkConfig.mode ?? prev.mode,
            isOffline: data.networkConfig.isOffline === true,
          }));
        }
        if (Array.isArray(data?.tasks) && data.tasks.length === 6) {
          setTasks(data.tasks);
        }
      } catch (err) {
        // silent bootstrap failure
      }
    };
    bootstrap();
  }, []);

  const connectWS = useCallback(() => {
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "REGISTER", side: "ALL" }));
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === "MESSAGE_DELIVERED") {
          setInTransitMessages((prev) => prev.filter((m) => m.id !== payload.id));
          if (payload.sender_side === "FIELD") {
            setFieldMessages((prev) =>
              prev.map((m) => (m.id === payload.id ? { ...m, status: "DELIVERED" } : m))
            );
            setHqMessages((prev) =>
              prev.some((m) => m.id === payload.id)
                ? prev.map((m) => (m.id === payload.id ? { ...m, status: "DELIVERED" } : m))
                : [...prev, { ...payload, status: "DELIVERED", advisoryStatus: null }]
            );
          } else {
            setHqMessages((prev) =>
              prev.map((m) => (m.id === payload.id ? { ...m, status: "DELIVERED" } : m))
            );
            setFieldMessages((prev) =>
              prev.some((m) => m.id === payload.id)
                ? prev.map((m) => (m.id === payload.id ? { ...m, status: "DELIVERED" } : m))
                : [...prev, { ...payload, status: "DELIVERED", advisoryStatus: null }]
            );
          }
          setStats((prev) => ({ ...prev, delivered: prev.delivered + 1 }));
          playDeliveryTone();
        } else if (type === "TASK_SYNCED") {
          setTasks((prev) =>
            prev.map((t) => (t.id === payload.id ? { ...payload, sync_state: "CONFIRMED" } : t))
          );
        } else if (type === "NETWORK_UPDATE") {
          setNetworkConfig((prev) => ({
            ...prev,
            delay_ms: payload.delay_ms ?? prev.delay_ms,
            bandwidth: payload.bandwidth ?? payload.bandwidth_pct ?? prev.bandwidth,
            packetLoss: payload.packetLoss ?? payload.packet_loss_pct ?? prev.packetLoss,
            mode: payload.mode ?? prev.mode,
            isOffline: payload.isOffline === true,
          }));
        } else if (type === "CONFLICT_DETECTED") {
          const mark = (arr) =>
            arr.map((m) =>
              m.id === payload.msg_id_1 || m.id === payload.msg_id_2
                ? { ...m, status: "CONFLICT" }
                : m
            );
          setFieldMessages(mark);
          setHqMessages(mark);
        }
      } catch (err) {
        // ignore
      }
    };

    ws.onclose = () => {
      if (!wsAllowReconnectRef.current) return;
      wsReconnectTimerRef.current = setTimeout(() => connectWS(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    wsAllowReconnectRef.current = true;
    connectWS();
    return () => {
      wsAllowReconnectRef.current = false;
      if (wsReconnectTimerRef.current) {
        clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWS]);

  async function getProtocolAdvisory(messageContent) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return "FIELD AUTHORITY: Field lead retains authority under ICS standing delegation.\nPROTOCOL REF: ICS 300 — Field operations continue under last confirmed directive during comm delay.\nRISK FLAG: Verify all actions against most recent confirmed HQ order before proceeding.";
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: "You are an ICS Protocol Advisor in a disaster response communication system during an active earthquake rescue. When given a field message, respond with exactly three labeled sections in under 120 words: FIELD AUTHORITY: What the field team can decide without HQ approval under ICS. PROTOCOL REF: The most relevant ICS 300/400 or NDRF guideline for this situation. RISK FLAG: One specific hazard or caution for this scenario type. Never predict HQ response. Never approve/deny requests. Reference protocols only.",
                },
              ],
            },
            contents: [{ parts: [{ text: messageContent }] }],
          }),
        }
      );
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "FIELD AUTHORITY: Field lead retains authority under ICS standing delegation.\nPROTOCOL REF: ICS 300 — Field operations continue under last confirmed directive during comm delay.\nRISK FLAG: Verify all actions against most recent confirmed HQ order before proceeding."
      );
    } catch (e) {
      return "FIELD AUTHORITY: Field lead retains authority under ICS standing delegation.\nPROTOCOL REF: ICS 300 — Field operations continue under last confirmed directive during comm delay.\nRISK FLAG: Verify all actions against most recent confirmed HQ order before proceeding.";
    }
  }

  const postMessage = async (message) => {
    await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: message.id,
        sequence_number: message.sequence_number,
        sender_role: message.sender_role,
        sender_side: message.sender_side,
        content: message.content,
        priority: message.priority,
        sent_at: message.sent_at,
        deliver_at: message.deliver_at,
      }),
    });
  };

  const buildMessage = ({ content, sender_side, sender_role, priority }) => {
    const now = Date.now();
    return {
      id: uuidv4(),
      sequence_number: ++seqRef.current,
      sender_role,
      sender_side,
      content,
      priority,
      sent_at: new Date(now).toISOString(),
      deliver_at: new Date(now + networkConfig.delay_ms).toISOString(),
      status: "QUEUED",
      advisoryStatus: "loading",
      advisoryText: null,
    };
  };

  const startTransit = (message) => {
    setTimeout(() => {
      const inTransit = {
        ...message,
        status: "IN_TRANSIT",
        direction: message.sender_side === "FIELD" ? "FIELD_TO_HQ" : "HQ_TO_FIELD",
      };
      if (message.sender_side === "FIELD") {
        setFieldMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "IN_TRANSIT" } : m)));
      } else {
        setHqMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "IN_TRANSIT" } : m)));
      }
      setInTransitMessages((prev) => [...prev, inTransit]);
      postMessage(inTransit).catch(() => {
        // keep queued visualization if send fails
      });
    }, 500);
  };

  const queueOrSend = (message) => {
    if (networkConfig.isOffline === true) {
      setQueuedMessages((prev) => [...prev, message]);
      return;
    }
    startTransit(message);
  };

  const sendFieldMessage = async () => {
    if (!fieldInput.trim()) return;
    const message = buildMessage({
      content: fieldInput.trim(),
      sender_side: "FIELD",
      sender_role: fieldRole,
      priority: fieldPriority,
    });
    setFieldMessages((prev) => [...prev, message]);
    setFieldInput("");
    getProtocolAdvisory(message.content).then((advisoryText) => {
      setFieldMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, advisoryStatus: "loaded", advisoryText } : m))
      );
    });
    queueOrSend(message);
  };

  const sendHqMessage = async () => {
    if (!hqInput.trim()) return;
    const baseMessage = buildMessage({
      content: hqInput.trim(),
      sender_side: "HQ",
      sender_role: hqRole,
      priority: hqPriority,
    });
    const message = networkConfig.isOffline === true ? baseMessage : { ...baseMessage, status: "IN_TRANSIT" };
    setHqMessages((prev) => [...prev, message]);
    setHqInput("");
    getProtocolAdvisory(message.content).then((advisoryText) => {
      setHqMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, advisoryStatus: "loaded", advisoryText } : m))
      );
    });
    if (networkConfig.isOffline === true) {
      setQueuedMessages((prev) => [...prev, message]);
    } else {
      setInTransitMessages((prev) => [...prev, { ...message, direction: "HQ_TO_FIELD" }]);
      postMessage(message).catch(() => {
        // no-op
      });
    }
  };

  const flushQueue = async (queued) => {
    setQueuedMessages([]);
    for (const msg of queued) {
      startTransit(msg);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  const onUpdateConfig = async (patch) => {
    const next = { ...networkConfig, ...patch };
    setNetworkConfig(next);
    try {
      await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch (err) {
      // ignore config post failures for UI continuity
    }
  };

  const onToggleLink = async () => {
    const nextOffline = !networkConfig.isOffline;
    const queuedSnapshot = [...queuedMessages];
    await onUpdateConfig({ isOffline: nextOffline });
    if (!nextOffline && queuedSnapshot.length > 0) {
      flushQueue(queuedSnapshot);
    }
  };

  const handleReset = async () => {
    setShowBriefing(true);
    setFieldMessages([PRESET_FIELD_MSG, PRESET_FIELD_MSG_2]);
    setHqMessages([PRESET_FIELD_MSG, PRESET_HQ_MSG, PRESET_FIELD_MSG_2]);
    setInTransitMessages([]);
    setQueuedMessages([]);
    seqRef.current = 3;
    setStats((prev) => ({ ...prev, delivered: 0, queued: 0 }));
    await fetch(`${API_URL}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delay_ms: 8000,
        bandwidth_pct: 100,
        packet_loss_pct: 0,
        mode: "DEMO — 8 SEC",
        isOffline: false,
        bandwidth: 100,
        packetLoss: 0,
      }),
    });
  };

  const toggleTask = async (taskId, currentStatus) => {
    const nextStatus =
      currentStatus === "PENDING" ? "IN_PROGRESS" : currentStatus === "IN_PROGRESS" ? "COMPLETE" : "PENDING";

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              field_status: nextStatus,
              sync_state: "SYNCING",
              field_updated_at: new Date().toISOString(),
            }
          : task
      )
    );

    try {
      await fetch(`${API_URL}/task/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, side: "FIELD", new_status: nextStatus }),
      });
    } catch (err) {
      // no-op
    }
  };

  if (showBriefing) {
    return <IncidentBriefing onComplete={() => setShowBriefing(false)} />;
  }

  if (showSplash) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0F1117",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 28,
              fontFamily: "monospace",
              fontWeight: "bold",
              color: "#F59E0B",
              letterSpacing: "0.35em",
              marginBottom: 8,
            }}
          >
            CHRONOSYNC
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#6B7280",
              letterSpacing: "0.1em",
              marginBottom: 24,
            }}
          >
            DISASTER RESPONSE COMMUNICATION SYSTEM
          </div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "#10B981", marginBottom: 20 }}>
            INITIALIZING COMMS LINK
            <span className="cursor-blink" style={{ marginLeft: 2 }}>
              _
            </span>
          </div>
          <div style={{ width: 240, height: 2, background: "#21262D", borderRadius: 1, margin: "0 auto" }}>
            <div className="progress-bar-fill" style={{ height: "100%", background: "#10B981", borderRadius: 1, width: 0 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F1117] text-[#E8E8E8] overflow-hidden">
      <div
        className="h-[18%] flex-shrink-0 bg-[#0D1117] p-3 flex gap-3"
        style={{ borderBottom: "1px solid #30363D", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
      >
        <TransitMap
          networkConfig={networkConfig}
          inTransitMessages={inTransitMessages}
          queuedMessages={queuedMessages}
          fieldMsgCount={fieldMessages.length}
          hqMsgCount={hqMessages.length}
        />
        <SimControlPanel
          networkConfig={networkConfig}
          stats={stats}
          onUpdateConfig={onUpdateConfig}
          onToggleLink={onToggleLink}
          onReset={handleReset}
        />
      </div>

      <div className="h-[62%] flex overflow-hidden relative">
        {networkConfig.bandwidth < 30 && networkConfig.isOffline !== true && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: "#451A03",
              color: "#FCD34D",
              padding: "5px 16px",
              fontSize: 12,
              fontFamily: "monospace",
              borderBottom: "1px solid #92400E",
            }}
          >
            ⚡ CRITICAL-ONLY MODE — Standard messages queued. HIGH priority messages transmitting.
          </div>
        )}

        <div className="w-1/2 flex flex-col" style={{ borderLeft: "2px solid #10B981" }}>
          {networkConfig.isOffline === true && (
            <div className="bg-[#450A0A] text-[#FCA5A5] px-4 py-1.5 text-[12px] font-mono border-b border-[#7F1D1D]">
              LINK DOWN — {queuedMessages.length} messages queued
            </div>
          )}
          <div
            className="bg-[#0D1117] px-[14px] py-[8px] border-b border-[#21262D] flex justify-between items-center"
            style={{ borderTop: "2px solid #10B981" }}
          >
            <span className="text-[11px] text-[#9CA3AF] font-mono uppercase">FIELD TEAM — RESCUE LEAD</span>
            <div className="flex items-center gap-[6px]">
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: networkConfig.isOffline ? "#EF4444" : "#10B981" }}
              />
              <span className="text-[10px] font-mono" style={{ color: networkConfig.isOffline ? "#EF4444" : "#10B981" }}>
                {networkConfig.isOffline ? "LINK DOWN" : "ONLINE"}
              </span>
            </div>
          </div>
          <div
            ref={fieldScrollRef}
            className="flex-1 overflow-y-auto px-3 flex flex-col gap-2.5"
            style={{ paddingTop: 8, paddingBottom: 8 }}
          >
            {fieldMessages.map((m) => (
              <MessageBubble key={m.id} message={m} isOwnMessage={m.sender_side === "FIELD"} />
            ))}
          </div>
          <div className="bg-[#0D1117] p-3 border-t border-[#21262D]">
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select
                value={fieldRole}
                onChange={(e) => setFieldRole(e.target.value)}
                style={{
                  background: "#161B22",
                  color: "#E8E8E8",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                <option value="FIELD_MEDIC">Field Medic</option>
                <option value="RESCUE_LEAD">Rescue Lead</option>
              </select>
              <select
                value={fieldPriority}
                onChange={(e) => setFieldPriority(e.target.value)}
                style={{
                  background: "#161B22",
                  color: fieldPriority === "HIGH" ? "#FCA5A5" : fieldPriority === "INFO" ? "#93C5FD" : "#A8A29E",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                <option value="HIGH">HIGH</option>
                <option value="STANDARD">STANDARD</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
              <textarea
                value={fieldInput}
                onChange={(e) => setFieldInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === "Enter") {
                    e.preventDefault();
                    sendFieldMessage();
                  }
                }}
                placeholder="Send field update to HQ..."
                style={{
                  flex: 1,
                  background: "#161B22",
                  color: "#E8E8E8",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "6px 10px",
                  fontSize: 13,
                  fontFamily: "system-ui",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.4,
                  height: 56,
                }}
              />
              <button
                onClick={sendFieldMessage}
                style={{
                  background: networkConfig.isOffline === true ? "#1C1917" : "#14532D",
                  color: networkConfig.isOffline === true ? "#6B7280" : "#86EFAC",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "monospace",
                  cursor: "pointer",
                  width: 80,
                  alignSelf: "stretch",
                }}
              >
                {networkConfig.isOffline === true ? "🔒 QUEUED" : "SEND"}
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            width: 2,
            background: "#21262D",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            className={inTransitMessages.length > 0 ? "transit-label-pulse" : ""}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#161B22",
              border: "1px solid #30363D",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 10,
              color: "#9CA3AF",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              zIndex: 5,
            }}
          >
            {delayLabel}
          </div>
        </div>

        <div className="w-1/2 flex flex-col" style={{ borderRight: "2px solid #3B82F6" }}>
          {networkConfig.isOffline === true && (
            <div className="bg-[#450A0A] text-[#FCA5A5] px-4 py-1.5 text-[12px] font-mono border-b border-[#7F1D1D]">
              LINK DOWN — {queuedMessages.length} messages queued
            </div>
          )}
          <div
            className="bg-[#0D1117] px-[14px] py-[8px] border-b border-[#21262D] flex justify-between items-center"
            style={{ borderTop: "2px solid #3B82F6" }}
          >
            <span className="text-[11px] text-[#9CA3AF] font-mono uppercase">HQ — INCIDENT COMMAND</span>
            <div className="flex items-center gap-[6px]">
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: networkConfig.isOffline ? "#EF4444" : "#10B981" }}
              />
              <span className="text-[10px] font-mono" style={{ color: networkConfig.isOffline ? "#EF4444" : "#10B981" }}>
                {networkConfig.isOffline ? "LINK DOWN" : "ONLINE"}
              </span>
            </div>
          </div>
          <div
            ref={hqScrollRef}
            className="flex-1 overflow-y-auto px-3 flex flex-col gap-2.5"
            style={{ paddingTop: 8, paddingBottom: 8 }}
          >
            {hqMessages.map((m) => (
              <MessageBubble key={m.id} message={m} isOwnMessage={m.sender_side === "HQ"} />
            ))}
          </div>
          <div className="bg-[#0D1117] p-3 border-t border-[#21262D]">
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select
                value={hqRole}
                onChange={(e) => setHqRole(e.target.value)}
                style={{
                  background: "#161B22",
                  color: "#E8E8E8",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                <option value="SECTOR_COMMANDER">SECTOR_COMMANDER</option>
                <option value="HQ_OPERATOR">HQ_OPERATOR</option>
              </select>
              <select
                value={hqPriority}
                onChange={(e) => setHqPriority(e.target.value)}
                style={{
                  background: "#161B22",
                  color: hqPriority === "HIGH" ? "#FCA5A5" : hqPriority === "INFO" ? "#93C5FD" : "#A8A29E",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                <option value="HIGH">HIGH</option>
                <option value="STANDARD">STANDARD</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
              <textarea
                value={hqInput}
                onChange={(e) => setHqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === "Enter") {
                    e.preventDefault();
                    sendHqMessage();
                  }
                }}
                placeholder="Send command to field team..."
                style={{
                  flex: 1,
                  background: "#161B22",
                  color: "#E8E8E8",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  padding: "6px 10px",
                  fontSize: 13,
                  fontFamily: "system-ui",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.4,
                  height: 56,
                }}
              />
              <button
                onClick={sendHqMessage}
                style={{
                  background: networkConfig.isOffline === true ? "#1C1917" : "#14532D",
                  color: networkConfig.isOffline === true ? "#6B7280" : "#86EFAC",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "monospace",
                  cursor: "pointer",
                  width: 80,
                  alignSelf: "stretch",
                }}
              >
                {networkConfig.isOffline === true ? "🔒 QUEUED" : "SEND"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[20%] flex-shrink-0 border-t border-[#21262D] flex bg-[#0D1117]">
        <TaskBoard title="MISSION TASKS — FIELD" tasks={tasks} onToggleTask={toggleTask} readonly={false} />
        <TaskBoard title="MISSION TASKS — HQ VIEW" tasks={tasks} readonly={true} />
      </div>
    </div>
  );
}

export default App;
