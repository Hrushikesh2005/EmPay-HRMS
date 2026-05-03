import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Settings,
  Building2,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { cn } from "../../utils/cn";
import useAuth from "../../hooks/useAuth.js";

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "Directory", href: "/directory", icon: Users, module: "directory" },
  { name: "Attendance", href: "/attendance", icon: Clock, module: "attendance" },
  { name: "Leave", href: "/leave", icon: Calendar, module: "leave" },
  { name: "Payroll", href: "/payroll", icon: CreditCard, module: "payroll" },
  { name: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { name: "Departments", href: "/departments", icon: Building2, module: "settings" },
  { name: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

export default function Sidebar() {
  const auth = useAuth();
  const user = auth?.user;
  const role = auth?.role || user?.role || "employee";

  const visibleNavItems = useMemo(() => {
    // Admin always sees everything
    if (role === "admin") return ALL_NAV_ITEMS;

    return ALL_NAV_ITEMS.filter((item) => {
      const perm = (auth?.permissions || []).find((p) => p.module === item.module);
      return perm && perm.access_level?.toLowerCase() !== "none";
    });
  }, [role, auth?.permissions]);

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full hidden md:flex border-r border-slate-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Building2 className="w-6 h-6 text-primary-500 mr-2" />
        <span className="text-lg font-bold text-white tracking-wide">
          EmPay
        </span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )
              }
            >
              <item.icon className="mr-3 w-5 h-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm flex items-center justify-between">
          <span className="truncate">Active Role:</span>
          <StatusBadge
            status={role}
            className="bg-slate-700 text-xs border-slate-600 text-slate-200"
          />
        </div>
      </div>
    </aside>
  );
}

function StatusBadge({ status, className }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full capitalize", className)}>
      {status.replace("_", " ")}
    </span>
  );
}
