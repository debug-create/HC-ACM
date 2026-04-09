import React from "react";

function TaskBoard({ title, tasks, onToggleTask, readonly }) {
  const confirmedCount = tasks.filter((t) =>
    readonly ? t.hq_status === "COMPLETE" : t.sync_state === "CONFIRMED"
  ).length;
  const allConfirmed = confirmedCount === tasks.length;
  const pendingCount = tasks.filter((task) => task.sync_state !== "CONFIRMED").length;

  const confirmedTasks = tasks
    .filter((task) => task.sync_state === "CONFIRMED")
    .sort(
      (a, b) =>
        new Date(b.hq_synced_at || 0).getTime() -
        new Date(a.hq_synced_at || 0).getTime()
    );
  const lastSyncTime = confirmedTasks[0]?.hq_synced_at
    ? new Date(confirmedTasks[0].hq_synced_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  const categoryTheme = (category) => {
    if (category === "STRUCTURAL") return { bg: "#451A03", color: "#FCD34D" };
    if (category === "MEDICAL") return { bg: "#4C0519", color: "#FDA4AF" };
    if (category === "COORDINATION") return { bg: "#172554", color: "#93C5FD" };
    if (category === "COMMAND") return { bg: "#14532D", color: "#86EFAC" };
    return { bg: "#1C2128", color: "#9CA3AF" };
  };

  return (
    <div
      style={{
        flex: 1,
        padding: "8px 12px",
        borderRight: readonly ? "none" : "1px solid #21262D",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace", textTransform: "uppercase" }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: allConfirmed ? "#10B981" : "#6B7280", fontFamily: "monospace" }}>
          {confirmedCount}/{tasks.length} CONFIRMED
        </div>
      </div>

      <div style={{ overflow: "hidden", maxHeight: "calc(100% - 26px)" }}>
        {tasks.map((task) => {
          const status = readonly ? task.hq_status : task.field_status;
          const theme = categoryTheme(task.category);
          const statusSymbol = status === "COMPLETE" ? "✓" : status === "IN_PROGRESS" ? "●" : "—";
          const statusColor = status === "COMPLETE" ? "#10B981" : status === "IN_PROGRESS" ? "#F59E0B" : "#6B7280";
          const syncIcon = task.sync_state === "CONFIRMED" ? "⊛" : task.sync_state === "SYNCING" ? "↻" : "⧖";
          const syncColor = task.sync_state === "CONFIRMED" ? "#10B981" : task.sync_state === "SYNCING" ? "#F59E0B" : "#4B5563";

          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 0",
                borderBottom: "1px solid #1C2128",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  background: theme.bg,
                  color: theme.color,
                  padding: "1px 4px",
                  borderRadius: 2,
                  fontSize: 9,
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                {task.category}
              </span>

              <span
                style={{
                  flex: 1,
                  color: "#D1D5DB",
                  fontSize: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.description}
              </span>

              <span
                onClick={() => {
                  if (!readonly) onToggleTask?.(task.id, status);
                }}
                style={{
                  color: statusColor,
                  fontSize: 12,
                  minWidth: 16,
                  textAlign: "center",
                  cursor: readonly ? "default" : "pointer",
                }}
                className={status === "IN_PROGRESS" ? "transit-label-pulse" : ""}
              >
                {statusSymbol}
              </span>

              <span
                title={
                  task.sync_state === "LOCAL_ONLY"
                    ? "Pending HQ sync"
                    : task.sync_state === "SYNCING"
                    ? "Syncing with HQ"
                    : "Confirmed by HQ"
                }
                className={task.sync_state === "SYNCING" ? "sync-spinning" : ""}
                style={{ color: syncColor, fontSize: 12, minWidth: 14 }}
              >
                {syncIcon}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 4, fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>
        LAST SYNC: {lastSyncTime} | {pendingCount} pending
      </div>
    </div>
  );
}

export default TaskBoard;
