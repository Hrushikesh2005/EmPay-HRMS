import { Card, CardContent } from "./Card";
import { cn } from "../../utils/cn";

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = "primary", className }) {
  const colorMap = {
    primary: "text-primary-600 bg-primary-100",
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {(trend) && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn("font-medium", trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-600")}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "−"} {trendValue}
            </span>
            <span className="text-slate-500 ml-2">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}