import React, { useState } from "react";

function ProtocolAdvisoryPanel({ status, advisory }) {
  const [expanded, setExpanded] = useState(false);

  if (!status) return null;

  return (
    <div className="mt-2 bg-[#0D1B2A] border-l-4 border-blue-500 rounded-r-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-[#152B3C] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#93C5FD] font-bold tracking-wider">
            ICS PROTOCOL ADVISORY
          </span>
          <span className="text-[10px] text-[#4B5563] italic">
            AI-generated. Not a command decision.
          </span>
        </div>
        <span className="text-[#4B5563] text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="p-3 pt-0 text-[12px] text-[#CBD5E1] leading-relaxed whitespace-pre-wrap border-t border-blue-500/20 mt-1">
          {status === "loading" ? "Querying ICS protocol database..." : advisory}
        </div>
      )}
    </div>
  );
}

export default ProtocolAdvisoryPanel;
