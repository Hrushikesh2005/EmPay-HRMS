import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Search,
  Menu,
  LogOut,
  Loader2,
  CheckCircle2,
  LogIn,
  Plane,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth.js";
import useRealtime from "../../hooks/useRealtime.js";
import api from "../../api/axios.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();

  const displayName = user?.full_name || "User";
  const roleLabel = user?.role ? user.role.replace(/_/g, " ") : "";
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

  // ── Attendance state ──────────────────────────────────────────────────────
  // Admin has no EmployeeProfile so we skip attendance tracking for them
  const isAdminRole = role === "admin";

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(!isAdminRole);
  const [actionLoading, setActionLoading] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const panelRef = useRef(null);

  const fetchTodayStatus = async () => {
    if (isAdminRole) return;
    try {
      const r = await api.get("/attendance/history");
      const todayEntry = (r.data || []).find((e) => e.work_date === today());
      setIsCheckedIn(!!todayEntry?.check_in);
      setIsCheckedOut(!!todayEntry?.check_out);
    } catch {
      // silent
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, [isAdminRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close panel on outside click
  useEffect(() => {
    if (!isQuickPanelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsQuickPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isQuickPanelOpen]);

  // Refresh via realtime events
  useRealtime((event) => {
    if (!event || event.type !== "attendance") return;
    fetchTodayStatus();
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post("/attendance/checkin", { remarks: "" });
      setIsCheckedIn(true);
      setIsCheckedOut(false);
      toast.success("Checked in successfully!");
      setIsQuickPanelOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post("/attendance/checkout", { remarks: "" });
      setIsCheckedOut(true);
      toast.success("Checked out successfully!");
      setIsQuickPanelOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Dot appearance ────────────────────────────────────────────────────────
  const showDot = !isAdminRole && !attendanceLoading;

  const dotStyle = useMemo(() => {
    if (actionLoading) return { color: "bg-amber-400 animate-pulse", label: "Working…" };
    if (isCheckedOut) return { color: "bg-slate-400", label: "Checked out for today" };
    if (isCheckedIn) return { color: "bg-emerald-500", label: "Checked in — click to manage" };
    return { color: "bg-red-500", label: "Not checked in — click to check in" };
  }, [isCheckedIn, isCheckedOut, actionLoading]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      {/* Left */}
      <div className="flex items-center">
        <button className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-transparent focus-within:bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search employees..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-4">
        {/* Bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          {/* Name / role */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900 leading-none">{displayName}</span>
            <span className="text-xs text-slate-500 mt-1 capitalize">{roleLabel}</span>
          </div>

          {/* Avatar + dot */}
          <div className="relative shrink-0" ref={panelRef}>
            {/* Avatar — navigates to profile */}
            <button
              onClick={() => navigate("/profile")}
              title="View My Profile"
              className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm border border-primary-200 hover:ring-2 hover:ring-primary-400 hover:ring-offset-1 transition-all cursor-pointer"
            >
              {initials || "U"}
            </button>

            {/* Status dot — opens attendance quick-panel */}
            {showDot && (
              <button
                type="button"
                onClick={() => setIsQuickPanelOpen((v) => !v)}
                title={dotStyle.label}
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all hover:scale-125 ${dotStyle.color}`}
              />
            )}

            {/* Quick attendance panel */}
            {isQuickPanelOpen && showDot && (
              <div className="absolute right-0 top-12 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 z-50">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isCheckedOut
                        ? "bg-slate-400"
                        : isCheckedIn
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Attendance</p>
                    <p className="text-xs text-slate-500">
                      {isCheckedOut
                        ? "Shift complete for today."
                        : isCheckedIn
                        ? "You are currently checked in."
                        : "You haven't checked in yet."}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Check In button — only when not yet checked in */}
                  {!isCheckedIn && !isCheckedOut && (
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      Check In
                    </button>
                  )}

                  {/* Check Out button — only when checked in but not yet checked out */}
                  {isCheckedIn && !isCheckedOut && (
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Check Out
                    </button>
                  )}

                  {/* Already checked out */}
                  {isCheckedOut && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 justify-center py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Shift ended for today
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
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
