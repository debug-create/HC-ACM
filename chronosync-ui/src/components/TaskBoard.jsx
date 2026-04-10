import React, { useEffect, useMemo, useRef, useState } from "react";

function formatTimeHHMMSS(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function categoryDotColor(category) {
  if (category === "STRUCTURAL") return "#FCD34D";
  if (category === "MEDICAL") return "#F87171";
  if (category === "COORDINATION") return "#93C5FD";
  if (category === "COMMAND") return "#86EFAC";
  return "#6B7280";
}

function nextStatus(status) {
  if (status === "PENDING") return "IN_PROGRESS";
  if (status === "IN_PROGRESS") return "COMPLETE";
  return "PENDING";
}

function counterColor(confirmedPct) {
  if (confirmedPct >= 67) return "#10B981";
  if (confirmedPct >= 34) return "#F59E0B";
  return "#EF4444";
}

function ConfirmedCounter({ confirmedCount, total, confirmedPct, color, pulse }) {
  const degrees = Math.max(0, Math.min(360, (Number(confirmedPct) || 0) * 3.6));

  return (
    <div
      className={pulse ? "counter-pulse" : ""}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: `conic-gradient(${color} ${degrees}deg, #1F2937 0deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#161B22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontFamily: "monospace",
          color: "#E8E8E8",
        }}
      >
        {confirmedCount}/{total}
      </div>
    </div>
  );
}

function TaskBoard({ tasks, side, onTaskUpdate, isActive = false }) {
  const normalizedTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const resolvedSide = side === "HQ" ? "HQ" : "FIELD";

  const [pressedTaskId, setPressedTaskId] = useState(null);
  const [counterPulse, setCounterPulse] = useState(false);
  const [confirmPopTaskId, setConfirmPopTaskId] = useState(null);

  const prevAllConfirmedRef = useRef(false);
  const animatedConfirmedRef = useRef({});
  const prevSyncStateRef = useRef({});

  const pulseTimerRef = useRef(null);
  const pulseOffTimerRef = useRef(null);
  const popTimerRef = useRef(null);
  const popOffTimerRef = useRef(null);

  const confirmedCount = useMemo(() => {
    if (resolvedSide === "HQ") return normalizedTasks.filter((t) => t.hq_status === "COMPLETE").length;
    return normalizedTasks.filter((t) => t.sync_state === "CONFIRMED").length;
  }, [normalizedTasks, resolvedSide]);

  const confirmedPct = normalizedTasks.length > 0 ? Math.round((confirmedCount / normalizedTasks.length) * 100) : 0;
  const ringColor = counterColor(confirmedPct);

  const pendingCount = useMemo(
    () => normalizedTasks.filter((t) => t.sync_state !== "CONFIRMED").length,
    [normalizedTasks],
  );

  const lastSyncTime = useMemo(() => {
    const last = normalizedTasks
      .map((t) => t.hq_synced_at)
      .filter(Boolean)
      .map((raw) => ({ raw, time: new Date(raw).getTime() }))
      .filter((v) => !Number.isNaN(v.time))
      .sort((a, b) => b.time - a.time)[0]?.raw;

    return formatTimeHHMMSS(last);
  }, [normalizedTasks]);

  useEffect(() => {
    const allConfirmed = normalizedTasks.length > 0 && confirmedCount === normalizedTasks.length;
    const prev = prevAllConfirmedRef.current;
    prevAllConfirmedRef.current = allConfirmed;

    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    if (pulseOffTimerRef.current) clearTimeout(pulseOffTimerRef.current);

    if (allConfirmed && !prev) {
      pulseTimerRef.current = setTimeout(() => {
        setCounterPulse(true);
        pulseOffTimerRef.current = setTimeout(() => setCounterPulse(false), 420);
      }, 0);
    }

    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (pulseOffTimerRef.current) clearTimeout(pulseOffTimerRef.current);
    };
  }, [confirmedCount, normalizedTasks.length]);

  useEffect(() => {
    for (const task of normalizedTasks) {
      const prev = prevSyncStateRef.current[task.id];
      const next = task.sync_state;

      if (next === "CONFIRMED" && prev === "SYNCING" && animatedConfirmedRef.current[task.id] !== true) {
        animatedConfirmedRef.current[task.id] = true;

        if (popTimerRef.current) clearTimeout(popTimerRef.current);
        if (popOffTimerRef.current) clearTimeout(popOffTimerRef.current);

        popTimerRef.current = setTimeout(() => {
          setConfirmPopTaskId(task.id);
          popOffTimerRef.current = setTimeout(() => setConfirmPopTaskId(null), 320);
        }, 0);
      }

      prevSyncStateRef.current[task.id] = next;
    }

    return () => {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      if (popOffTimerRef.current) clearTimeout(popOffTimerRef.current);
    };
  }, [normalizedTasks]);

  const isInteractive = resolvedSide === "FIELD" && typeof onTaskUpdate === "function";

  const containerBoxShadow = isActive
    ? "0 0 0 1px #10B981, 0 0 8px 0 rgba(16,185,129,0.2)"
    : "none";

  return (
    <div
      className="relative flex-1 min-w-0 min-h-0 flex flex-col"
      style={{ background: "transparent", boxShadow: containerBoxShadow, transition: "box-shadow 300ms ease" }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes confirmPop { 0%{transform:scale(1)} 50%{transform:scale(1.5)} 100%{transform:scale(1)} }
        @keyframes taskComplete { from{text-decoration-color:transparent} to{text-decoration-color:currentColor} }
        @keyframes counterPulse { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }

        .spin { animation: spin 1.5s linear infinite; }
        .dotPulse { animation: dotPulse 0.8s ease-in-out infinite; }
        .confirm-pop { animation: confirmPop 300ms ease-out; }
        .task-complete { transition: color 300ms ease; text-decoration-line: line-through; animation: taskComplete 300ms ease; }
        .counter-pulse { animation: counterPulse 400ms ease; }
      `}</style>

      <div className="h-8 flex-shrink-0 flex items-center justify-between px-3">
        <div className="text-[12px] font-mono text-[#E8E8E8] tracking-wide truncate">
          {resolvedSide === "FIELD" ? "FIELD TASKS" : "HQ TASKS"}
        </div>

        <ConfirmedCounter
          confirmedCount={confirmedCount}
          total={normalizedTasks.length}
          confirmedPct={confirmedPct}
          color={ringColor}
          pulse={counterPulse}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        {normalizedTasks.map((task) => {
          const displayStatus = resolvedSide === "HQ" ? task.hq_status : task.field_status;
          const dotColor = categoryDotColor(task.category);
          const isPressed = pressedTaskId === task.id;

          const syncState = task.sync_state || "LOCAL_ONLY";
          const syncIcon =
            syncState === "CONFIRMED"
              ? "\u2713\u2713"
              : syncState === "SYNCING"
                ? "\u23F1"
                : "\u23F1";
          const syncColor =
            syncState === "CONFIRMED" ? "#10B981" : syncState === "SYNCING" ? "#F59E0B" : "#6B7280";

          const descriptionClass = task.field_status === "COMPLETE" ? "task-complete text-[#4B5563]" : "text-[#D1D5DB]";

          const statusText = displayStatus === "COMPLETE" ? "DONE" : displayStatus === "IN_PROGRESS" ? "IN PROG" : "—";
          const statusColor = displayStatus === "COMPLETE" ? "#10B981" : displayStatus === "IN_PROGRESS" ? "#F59E0B" : "#6B7280";

          return (
            <div
              key={task.id}
              className={[
                "h-9 max-h-9 flex items-center gap-2 rounded px-2 select-none",
                isInteractive ? "cursor-pointer hover:bg-[#0D2A0D] transition-colors duration-150" : "cursor-default pointer-events-none",
                isPressed ? "scale-[0.98]" : "scale-100",
              ].join(" ")}
              style={{ transition: isInteractive ? "transform 80ms ease" : undefined }}
              onMouseDown={() => {
                if (!isInteractive) return;
                setPressedTaskId(task.id);
              }}
              onMouseUp={() => setPressedTaskId(null)}
              onMouseLeave={() => setPressedTaskId(null)}
              onClick={() => {
                if (!isInteractive) return;
                onTaskUpdate(task.id, nextStatus(task.field_status));
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />

              <span
                className={[
                  "flex-1 min-w-0 text-[12px] overflow-hidden text-ellipsis whitespace-nowrap",
                  descriptionClass,
                ].join(" ")}
              >
                {task.description}
              </span>

              <span
                className="w-[80px] flex-shrink-0 text-right text-[12px] font-mono"
                style={{ color: statusColor, opacity: resolvedSide === "HQ" ? 0.4 : 1 }}
              >
                {displayStatus === "IN_PROGRESS" ? (
                  <span>
                    <span className="dotPulse inline-block mr-1">●</span>
                    {statusText}
                  </span>
                ) : displayStatus === "COMPLETE" ? (
                  <span>{"\u2713"} {statusText}</span>
                ) : (
                  <span>{"\u2014"}</span>
                )}
              </span>

              <span
                className={[
                  "w-5 flex-shrink-0 text-right text-[12px] font-mono",
                  syncState === "SYNCING" ? "spin" : "",
                  syncState === "CONFIRMED" && confirmPopTaskId === task.id ? "confirm-pop" : "",
                ].join(" ")}
                style={{ color: syncColor }}
                title={
                  syncState === "LOCAL_ONLY"
                    ? "Pending HQ sync"
                    : syncState === "SYNCING"
                      ? "Syncing with HQ"
                      : "Confirmed by HQ"
                }
              >
                {syncIcon}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-6 flex-shrink-0 px-3 flex items-center font-mono text-[10px] text-[#6B7280]">
        <span className="truncate">
          LAST HQ SYNC: {lastSyncTime ?? "NO HQ SYNC YET"} {"\u2014"} {" "}
          <span style={{ color: pendingCount > 0 ? "#F59E0B" : "#6B7280" }}>{pendingCount} updates pending</span>
        </span>
      </div>
    </div>
  );
}

export default TaskBoard;
