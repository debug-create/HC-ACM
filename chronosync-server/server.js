require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// IN-MEMORY STATE
let sequenceCounter = 0;

let networkConfig = {
  delay_ms: 8000,
  bandwidth_pct: 100,
  packet_loss_pct: 0,
  mode: "DEMO",
  isOffline: false
};

let messages = [];

let tasks = [
  { id: "task-1", category: "STRUCTURAL", description: "Block C structural assessment", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" },
  { id: "task-2", category: "STRUCTURAL", description: "Entry point B cleared for access", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" },
  { id: "task-3", category: "MEDICAL", description: "Sector 1 triage complete", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" },
  { id: "task-4", category: "MEDICAL", description: "Medical airlift requested", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" },
  { id: "task-5", category: "COORDINATION", description: "Secondary team deployed to Grid 4", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" },
  { id: "task-6", category: "COMMAND", description: "Evacuation order acknowledged by HQ", 
    field_status: "PENDING", hq_status: "UNKNOWN", 
    field_updated_at: new Date().toISOString(), hq_synced_at: null, 
    sync_state: "LOCAL_ONLY" }
];

// WEBSOCKET SETUP
const clients = new Map();

function broadcast(eventType, payload, targetSide) {
  const message = JSON.stringify({ type: eventType, payload });
  clients.forEach((data, ws) => {
    if (targetSide === "ALL" || data.side === targetSide) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'REGISTER') {
        clients.set(ws, { side: data.side });
        console.log(`Client registered as ${data.side}`);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// CONFLICT DETECTION
function checkForConflicts(newMessage) {
  const words = newMessage.content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  
  const conflictMsg = messages.find(m => {
    // Basic criteria
    if (m.id === newMessage.id) return false;
    if (m.sender_side === newMessage.sender_side) return false;
    
    // Status criteria: IN_TRANSIT or recently DELIVERED (within last delay_ms * 2)
    const isRecent = (new Date() - new Date(m.sent_at)) < (networkConfig.delay_ms * 2);
    if (m.status !== "IN_TRANSIT" && !(m.status === "DELIVERED" && isRecent)) return false;

    // Content criteria: keyword overlap
    const mWords = m.content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    return words.some(w => mWords.includes(w));
  });

  if (conflictMsg) {
    conflictMsg.status = "CONFLICT";
    newMessage.status = "CONFLICT";
    broadcast("CONFLICT_DETECTED", {
      msg_id_1: newMessage.id,
      seq1: newMessage.sequence_number,
      msg_id_2: conflictMsg.id,
      seq2: conflictMsg.sequence_number
    }, "ALL");
  }
}

// REST ENDPOINTS
app.post('/api/reset', (req, res) => {
  messages.length = 0;
  tasks.forEach((t, i) => {
    t.field_status = 'PENDING';
    t.hq_status = 'UNKNOWN';  
    t.sync_state = 'LOCAL_ONLY';
    t.hq_synced_at = null;
  });
  Object.assign(networkConfig, {
    delay_ms: 8000, bandwidth_pct: 100,
    packet_loss_pct: 0, mode: 'DEMO', isOffline: false
  });
  broadcast('NETWORK_UPDATE', networkConfig, 'ALL');
  res.json({ ok: true });
});
app.post('/api/send', (req, res) => {
  const { id, sequence_number, sender_role, sender_side, content, priority, sent_at, deliver_at } = req.body;
  
  const message = {
    id: id || uuidv4(),
    sequence_number: sequence_number || ++sequenceCounter,
    sender_role,
    sender_side,
    content,
    priority,
    sent_at: sent_at || new Date().toISOString(),
    deliver_at: deliver_at || new Date(Date.now() + networkConfig.delay_ms).toISOString(),
    status: "IN_TRANSIT",
    protocol_advisory: null
  };

  messages.push(message);

  setTimeout(() => {
    const msg = messages.find(m => m.id === message.id);
    if (msg && msg.status === "IN_TRANSIT") {
      msg.status = "DELIVERED";
      // Dual-pane client: both panels run in same browser, broadcast ALL
      broadcast("MESSAGE_DELIVERED", msg, "ALL");
      checkForConflicts(msg);
    }
  }, networkConfig.delay_ms);

  res.json({ success: true, message });
});

app.post('/api/task/update', (req, res) => {
  const { task_id, side, new_status } = req.body;
  const task = tasks.find(t => t.id === task_id);

  if (!task) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  if (side === "FIELD") {
    task.field_status = new_status;
    task.field_updated_at = new Date().toISOString();
    task.sync_state = "SYNCING";

    setTimeout(() => {
      task.hq_status = new_status;
      task.hq_synced_at = new Date().toISOString();
      task.sync_state = "CONFIRMED";
      broadcast("TASK_SYNCED", task, "ALL");
    }, networkConfig.delay_ms);
  } else {
    // HQ directly updates (though instructions mostly focus on Field->HQ delay)
    task.hq_status = new_status;
    task.hq_synced_at = new Date().toISOString();
    task.sync_state = "CONFIRMED";
    broadcast("TASK_SYNCED", task, "ALL");
  }

  res.json({ success: true, task });
});

app.post('/api/config', (req, res) => {
  const incoming = { ...req.body };
  if (typeof incoming.bandwidth === "number") incoming.bandwidth_pct = incoming.bandwidth;
  if (typeof incoming.packetLoss === "number") incoming.packet_loss_pct = incoming.packetLoss;
  Object.assign(networkConfig, incoming);
  broadcast("NETWORK_UPDATE", networkConfig, "ALL");
  res.json({ success: true, config: networkConfig });
});

app.get('/api/state', (req, res) => {
  res.json({ messages, tasks, networkConfig });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`ChronoSync server running on port ${PORT}`);
});
