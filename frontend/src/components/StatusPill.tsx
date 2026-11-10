// src/components/StatusPill.tsx
import React from "react";

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Funded", color: "bg-amber-200 text-amber-800" },
  1: { label: "Submitted", color: "bg-blue-200 text-blue-800" },
  2: { label: "Completed", color: "bg-green-200 text-green-800" },
  3: { label: "Refunded", color: "bg-gray-200 text-gray-800" },
  4: { label: "Disputed", color: "bg-red-200 text-red-800" }
};

interface Props {
  status: number; // enum value
}

const StatusPill: React.FC<Props> = ({ status }) => {
  const info = statusMap[status] ?? { label: "Unknown", color: "bg-gray-200 text-gray-800" };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${info.color}`}>
      {info.label}
    </span>
  );
};

export default StatusPill;

