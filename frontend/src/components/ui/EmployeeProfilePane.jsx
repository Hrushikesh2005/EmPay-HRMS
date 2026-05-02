import { useEffect, useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  Calendar,
  Shield,
  FileText,
  Lock,
  DollarSign,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { fetchEmployeeSalary, changeUserPassword } from "../../services/employees";
import useAuth from "../../hooks/useAuth";

const TABS = [
  { id: "resume", label: "Resume", icon: FileText },
  { id: "private", label: "Private Info", icon: Info },
  { id: "salary", label: "Salary Info", icon: DollarSign, privileged: true },
  { id: "security", label: "Security", icon: Lock },
];

function Avatar({ name, size = "lg" }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
  ];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg shrink-0",
        colors[colorIdx],
        size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-base"
      )}
    >
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 font-medium mt-0.5 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function SalaryCard({ label, value, sub }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">
        ₹{parseFloat(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Tab: Resume ─────────────────────────────────────────────────────────────
function ResumeTab({ emp }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary-50 to-violet-50 rounded-xl p-4 border border-primary-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">About</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {emp.designation
            ? `${emp.user?.full_name} currently serves as ${emp.designation}${emp.department ? ` in the ${emp.department} department` : ""}.`
            : "No biographical information available yet."}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary-500" />
          Work Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Department</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{emp.department || "—"}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Designation</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{emp.designation || "—"}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Employment Type</p>
            <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
              {emp.employment_type?.replace("_", " ") || "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Date of Joining</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {emp.date_of_joining
                ? new Date(emp.date_of_joining).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Private Info ───────────────────────────────────────────────────────
function PrivateInfoTab({ emp }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-4">Contact & Identity</p>
      <InfoRow icon={Hash} label="Employee ID" value={emp.id} />
      <InfoRow icon={User} label="Full Name" value={emp.user?.full_name} />
      <InfoRow icon={Mail} label="Email Address" value={emp.user?.email} />
      <InfoRow icon={Phone} label="Mobile Number" value={emp.phone} />
      <InfoRow icon={Building2} label="Department" value={emp.department} />
      <InfoRow icon={Briefcase} label="Designation" value={emp.designation} />
      <InfoRow
        icon={Calendar}
        label="Date of Joining"
        value={
          emp.date_of_joining
            ? new Date(emp.date_of_joining).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : null
        }
      />
      <InfoRow
        icon={Shield}
        label="Role"
        value={emp.user?.role?.replace("_", " ")}
      />
    </div>
  );
}

// ─── Tab: Salary Info ────────────────────────────────────────────────────────
function SalaryInfoTab({ employeeId }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeSalary(employeeId)
      .then(setSalary)
      .catch((e) =>
        setError(e?.response?.data?.detail || "No salary data available")
      )
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );

  const gross =
    parseFloat(salary.basic_salary || 0) +
    parseFloat(salary.hra || 0) +
    parseFloat(salary.other_allowances || 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3">
        <SalaryCard label="Basic Salary" value={salary.basic_salary} />
        <div className="grid grid-cols-2 gap-3">
          <SalaryCard label="HRA" value={salary.hra} />
          <SalaryCard label="Other Allowances" value={salary.other_allowances} />
        </div>
        <SalaryCard
          label="Gross Salary (CTC)"
          value={gross}
          sub="Basic + HRA + Allowances"
        />
      </div>

      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">Deductions</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl border border-red-100 p-3">
            <p className="text-xs text-red-400 font-medium">PF (Employee %)</p>
            <p className="text-lg font-bold text-red-700 mt-1">{salary.pf_employee_pct}%</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-3">
            <p className="text-xs text-orange-400 font-medium">PF (Employer %)</p>
            <p className="text-lg font-bold text-orange-700 mt-1">{salary.pf_employer_pct}%</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 col-span-2">
            <p className="text-xs text-amber-500 font-medium">Professional Tax</p>
            <p className="text-lg font-bold text-amber-700 mt-1">
              ₹{parseFloat(salary.professional_tax || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Effective Period</p>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          From{" "}
          {new Date(salary.effective_from).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {salary.effective_to
            ? ` — ${new Date(salary.effective_to).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`
            : " (Current)"}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Security ───────────────────────────────────────────────────────────
function SecurityTab({ emp }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg }
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggleShow = (field) => () =>
    setShowPasswords((s) => ({ ...s, [field]: !s[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (form.new_password !== form.confirm_password) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (form.new_password.length < 8) {
      setStatus({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword(emp.user?.id, form.current_password, form.new_password);
      setStatus({ type: "success", msg: "Password changed successfully!" });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err?.response?.data?.detail || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ formKey, showKey, label, placeholder }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={showPasswords[showKey] ? "text" : "password"}
          value={form[formKey]}
          onChange={handleChange(formKey)}
          placeholder={placeholder}
          className="w-full pr-10 pl-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          required
        />
        <button
          type="button"
          onClick={toggleShow(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPasswords[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Password Security</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Changing password for <strong>{emp.user?.full_name}</strong>. The current password must be provided.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField formKey="current_password" showKey="current" label="Current Password" placeholder="Enter current password" />
        <PasswordField formKey="new_password" showKey="new" label="New Password" placeholder="Min. 8 characters" />
        <PasswordField formKey="confirm_password" showKey="confirm" label="Confirm New Password" placeholder="Repeat new password" />

        {status && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {status.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {loading ? "Changing…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function EmployeeProfilePane({ employee, onClose }) {
  const { role } = useAuth();
  const canSeeSalary = role === "admin" || role === "payroll_officer";

  const visibleTabs = TABS.filter((t) => !t.privileged || canSeeSalary);
  const [activeTab, setActiveTab] = useState("resume");

  // Reset tab when a different employee is opened
  useEffect(() => {
    setActiveTab("resume");
  }, [employee?.id]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emp = employee;
  const isOpen = !!emp;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sliding Pane */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {emp && (
          <>
            {/* ── Header ── */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-0">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Employee hero */}
              <div className="flex items-center gap-4 mb-5">
                <Avatar name={emp.user?.full_name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">
                    {emp.user?.full_name || "—"}
                  </h2>
                  <p className="text-sm text-slate-400 truncate mt-0.5">
                    {emp.designation || "No designation"}{" "}
                    {emp.department ? `· ${emp.department}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                      <Mail className="w-3 h-3" />
                      {emp.user?.email || "—"}
                    </span>
                    {emp.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-white/10 -mx-6 px-6 gap-1 overflow-x-auto">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium px-4 py-3 border-b-2 transition-colors whitespace-nowrap shrink-0",
                        isActive
                          ? "border-primary-400 text-primary-400"
                          : "border-transparent text-slate-400 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "resume" && <ResumeTab emp={emp} />}
              {activeTab === "private" && <PrivateInfoTab emp={emp} />}
              {activeTab === "salary" && canSeeSalary && (
                <SalaryInfoTab employeeId={emp.id} />
              )}
              {activeTab === "security" && <SecurityTab emp={emp} />}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
