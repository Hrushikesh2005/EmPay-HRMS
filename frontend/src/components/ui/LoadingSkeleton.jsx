import { cn } from "../../utils/cn";

export function LoadingSkeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}

// Pre-composed skeletons for common use cases
export function CardSkeleton() {
  return (
    <div className="border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <LoadingSkeleton className="h-6 w-1/3" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
      <div className="pt-4 flex gap-2">
        <LoadingSkeleton className="h-10 w-24" />
        <LoadingSkeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
