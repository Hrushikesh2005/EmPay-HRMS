import { cn } from "../../utils/cn";

export function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
