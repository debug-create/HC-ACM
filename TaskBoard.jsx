import { useState, useCallback } from "react";
import TaskBoard from "@/components/TaskBoard";

type FieldStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE";
type SyncState = "LOCAL_ONLY" | "SYNCING" | "CONFIRMED";
type Category = "STRUCTURAL" | "MEDICAL" | "COORDINATION" | "COMMAND";

interface Task {
  id: string;
  category: Category;
  description: string;
  field_status: FieldStatus;
  hq_status: string;
  sync_state: SyncState;
  field_updated_at: string;
  hq_synced_at: string;
}

const initialTasks: Task[] = [
  { id: "1", category: "STRUCTURAL" as const, description: "Assess bridge integrity on Route 7 — north span", field_status: "PENDING" as const, hq_status: "PENDING", sync_state: "CONFIRMED" as const, field_updated_at: "", hq_synced_at: "" },
  { id: "2", category: "MEDICAL" as const, description: "Deploy triage unit to sector 4B shelter", field_status: "IN_PROGRESS" as const, hq_status: "PENDING", sync_state: "SYNCING" as const, field_updated_at: "", hq_synced_at: "" },
  { id: "3", category: "COORDINATION" as const, description: "Coordinate evacuation bus schedule with transport HQ", field_status: "PENDING" as const, hq_status: "PENDING", sync_state: "LOCAL_ONLY" as const, field_updated_at: "", hq_synced_at: "" },
  { id: "4", category: "COMMAND" as const, description: "Establish forward command post at grid ref 34N-12E", field_status: "COMPLETE" as const, hq_status: "COMPLETE", sync_state: "CONFIRMED" as const, field_updated_at: "", hq_synced_at: "" },
  { id: "5", category: "MEDICAL" as const, description: "Restock medical supplies at Camp Delta", field_status: "PENDING" as const, hq_status: "PENDING", sync_state: "CONFIRMED" as const, field_updated_at: "", hq_synced_at: "" },
];

const Index = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const handleTaskUpdate = useCallback((taskId: string, newStatus: string) => {
    // Set status + LOCAL_ONLY immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, field_status: newStatus as any, sync_state: "LOCAL_ONLY" as const, field_updated_at: new Date().toISOString() }
          : t
      )
    );

    // LOCAL_ONLY → SYNCING after 1s
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId && t.sync_state === "LOCAL_ONLY" ? { ...t, sync_state: "SYNCING" as const } : t))
      );
    }, 1000);

    // SYNCING → CONFIRMED after 3s
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId && t.sync_state === "SYNCING" ? { ...t, sync_state: "CONFIRMED" as const, hq_synced_at: new Date().toISOString() } : t))
      );
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F1117" }}>
      <div className="max-w-3xl mx-auto pt-8">
        <TaskBoard tasks={tasks} side="FIELD" onTaskUpdate={handleTaskUpdate} />
      </div>
    </div>
  );
};

export default Index;
