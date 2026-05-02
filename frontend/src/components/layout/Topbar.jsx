import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.full_name || "User";
  const roleLabel = user?.role ? user.role.replace("_", " ") : "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center">
        {/* Mobile menu button (hidden on desktop) */}
        <button className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>

        {/* Optional Search */}
        <div className="hidden sm:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-transparent focus-within:bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search employees..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900 leading-none">
              {displayName}
            </span>
            <span className="text-xs text-slate-500 mt-1">{roleLabel}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm border border-primary-200 shrink-0">
            {initials || "U"}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-danger transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
