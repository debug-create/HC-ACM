export const ROLES = {
  FIELD_MEDIC: { label: "Field Medic", color: "#93C5FD", bg: "#1E3A5F" },
  RESCUE_LEAD: { label: "Rescue Lead", color: "#5EEAD4", bg: "#134E4A" },
  SECTOR_COMMANDER: { label: "Sector Cmdr", color: "#FCD34D", bg: "#451A03" },
  HQ_OPERATOR: { label: "HQ Operator", color: "#86EFAC", bg: "#14532D" }
};

export const PRIORITIES = {
  HIGH: { label: "HIGH", color: "#FCA5A5", bg: "#7F1D1D" },
  STANDARD: { label: "STANDARD", color: "#A8A29E", bg: "#1C1917" },
  INFO: { label: "INFO", color: "#93C5FD", bg: "#172554" }
};

export const STATUS_COLORS = {
  QUEUED: "#78716C",
  IN_TRANSIT: "#F59E0B",
  DELIVERED: "#10B981",
  CONFLICT: "#EF4444"
};

export const DELAY_MODES = [
  { label: "DEMO — 8 SEC", ms: 8000 },
  { label: "DEGRADED — 90 SEC", ms: 90000 },
  { label: "DEEP FIELD — 5 MIN", ms: 300000 },
  { label: "FULL SATELLITE — 20 MIN", ms: 1200000 }
];

export const WS_URL = "ws://localhost:3001";
export const API_URL = "http://localhost:3001/api";
