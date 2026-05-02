import React from "react";
import { cn } from "../../utils/cn";

const badgeVariants = {
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  present: "bg-blue-100 text-blue-800 border-blue-200",
  absent: "bg-red-100 text-red-800 border-red-200",
  half_day: "bg-orange-100 text-orange-800 border-orange-200",
  on_leave: "bg-purple-100 text-purple-800 border-purple-200",
  default: "bg-slate-100 text-slate-800 border-slate-200",
};

export function StatusBadge({ status, className }) {
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase().replace(" ", "_") : "default";
  const variantClass = badgeVariants[normalizedStatus] || badgeVariants.default;
  
  // Format text: "half_day" -> "Half Day"
  const displayText = typeof status === 'string' ? status.replace("_", " ") : String(status);

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", variantClass, className)}>
      {displayText}
    </span>
  );
}
