import React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export function EmptyState({ 
  icon: Icon = FolderSearch, 
  title = "No data found", 
  description = "Get started by creating a new record.", 
  actionLabel, 
  onAction, 
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex-1 min-h-[300px]", className)}>
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
