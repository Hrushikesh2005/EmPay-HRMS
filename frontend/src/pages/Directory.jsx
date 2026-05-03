import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Plane } from "lucide-react";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { EmployeeProfileView } from "../components/ui/EmployeeProfileView";
import { fetchEmployees } from "../services/employees";
import useAuth from "../hooks/useAuth.js";
import useRealtime from "../hooks/useRealtime.js";

function AttendanceMarker({ status }) {
  const normalized = (status || "absent").toLowerCase();

  if (normalized === "present") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Present
      </span>
    );
  }

  if (normalized === "on_leave") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 border border-sky-100">
        <Plane className="w-3 h-3" />
        On Leave
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 border border-amber-100">
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      Absent
    </span>
  );
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Directory() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "hr_officer";

  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      try {
        const data = await fetchEmployees();
        if (isMounted) setEmployees(data || []);
      } catch (err) {
        if (isMounted)
          setError(err?.response?.data?.detail || "Unable to load employees.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  useRealtime((event) => {
    if (event?.type === "attendance") {
      fetchEmployees()
        .then((data) => setEmployees(data || []))
        .catch((err) => {
          console.error("Failed to refresh employees", err);
        });
    }
  });

  // Auto-refresh the employee list every 3 s (background, no loading flash)
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await fetchEmployees();
        if (isMounted) setEmployees(data || []);
      } catch {
        // silent — don't disrupt the UI on background refresh errors
      }
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return employees.filter((emp) =>
      [emp.user?.full_name, emp.user?.email, emp.department, emp.designation]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [employees, searchTerm]);

  // ── When an employee is selected, show their full-page profile ──
  if (selectedEmployee) {
    return (
      <EmployeeProfileView
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  // ── Otherwise show the directory listing ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Click any employee card to view their full profile."
        actions={
          canEdit && (
            <Button className="gap-2" onClick={() => navigate("/register")}>
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
          )
        }
      />

      {/* Search & Filter bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or department…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Employee Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 text-sm text-center">
          {error}
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const name = emp.user?.full_name || "Unknown";
            const color = getAvatarColor(name);

            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="relative w-full text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <div className="absolute right-4 top-4">
                  <AttendanceMarker status={emp.attendance_status} />
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${color} flex items-center justify-center text-white font-bold text-base shrink-0 shadow`}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                      {name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {emp.user?.email || "—"}
                    </p>
                  </div>
                </div>

                {/* Dept + badge */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-600 truncate">
                      {emp.designation || "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {emp.department || "—"}
                    </p>
                  </div>
                  <StatusBadge status={emp.employment_type || "default"} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">
            No employees found{searchTerm ? ` matching "${searchTerm}"` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
