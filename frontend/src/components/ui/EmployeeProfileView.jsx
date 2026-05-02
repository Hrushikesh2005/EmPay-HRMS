import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Info,
  DollarSign,
  AlertCircle,
  Building2,
  Briefcase,
  Hash,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { fetchEmployeeSalary } from "../../services/employees";
import useAuth from "../../hooks/useAuth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatINR(v) {
  return `₹${parseFloat(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Underlined label + value pair used in the right org column */
function OrgField({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="border-b border-slate-200 pb-1">
        <p className="text-sm text-slate-700 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

/** Inline label + value row used in the left identity column */
function IdentityField({ label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-400 w-20 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-slate-800 font-medium truncate">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Tab: Resume ─────────────────────────────────────────────────────────────

function ResumeTab({ emp }) {
  const skillTags = [
    emp.department,
    emp.designation,
    emp.employment_type?.replace("_", " "),
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — long-form bio sections */}
      <div className="lg:col-span-2 space-y-8">
        {/* About */}
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            About
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {emp.designation
              ? `${emp.user?.full_name} currently serves as ${emp.designation}${
                  emp.department ? ` in the ${emp.department} department` : ""
                }.`
              : "No biographical information has been added yet."}
          </p>
        </section>

        {/* What I love about my job */}
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            What I do at work
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {emp.department
              ? `Working in the ${emp.department} department${
                  emp.designation ? ` as ${emp.designation}` : ""
                }.`
              : "No additional work information provided."}
          </p>
        </section>

        {/* Interests / Tenure */}
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            Tenure
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {emp.date_of_joining
              ? `Joined the organisation on ${formatDate(emp.date_of_joining)}.`
              : "Joining date has not been recorded."}
          </p>
        </section>
      </div>

      {/* Right — Skills & Certifications cards */}
      <div className="space-y-4">
        {/* Skills */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Skills</h3>
          {skillTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillTags.map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full font-medium capitalize"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No skills added.</p>
          )}
        </div>

        {/* Certification */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Certifications
          </h3>
          <p className="text-xs text-slate-400">No certifications added.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Private Info ────────────────────────────────────────────────────────

function PrivateInfoTab({ emp }) {
  const rows = [
    { icon: Hash, label: "Employee ID", value: emp.id },
    { icon: Shield, label: "Full Name", value: emp.user?.full_name },
    { icon: Mail, label: "Email", value: emp.user?.email },
    { icon: Phone, label: "Mobile", value: emp.phone },
    { icon: Building2, label: "Department", value: emp.department },
    { icon: Briefcase, label: "Designation", value: emp.designation },
    {
      icon: Users,
      label: "Employment",
      value: emp.employment_type?.replace(/_/g, " "),
    },
    { icon: Calendar, label: "Joined On", value: formatDate(emp.date_of_joining) },
    {
      icon: Shield,
      label: "System Role",
      value: emp.user?.role?.replace(/_/g, " "),
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {rows.map(({ icon: Icon, label, value }, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-sm text-slate-400 font-medium w-32 shrink-0">
              {label}
            </span>
            <span className="text-sm text-slate-800 font-medium truncate">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Salary Info ─────────────────────────────────────────────────────────

function SalaryInfoTab({ employeeId }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchEmployeeSalary(employeeId)
      .then(setSalary)
      .catch((e) =>
        setError(e?.response?.data?.detail || "No salary structure found.")
      )
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500 max-w-lg">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
        {error}
      </div>
    );
  }

  const gross =
    parseFloat(salary.basic_salary || 0) +
    parseFloat(salary.hra || 0) +
    parseFloat(salary.other_allowances || 0);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Earnings table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Earnings
        </p>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {[
            { label: "Basic Salary", value: formatINR(salary.basic_salary) },
            {
              label: "House Rent Allowance (HRA)",
              value: formatINR(salary.hra),
            },
            {
              label: "Other Allowances",
              value: formatINR(salary.other_allowances),
            },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className="text-sm font-semibold text-slate-800">
                {r.value}
              </span>
            </div>
          ))}
          {/* Gross total row */}
          <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-t border-emerald-100">
            <span className="text-sm font-bold text-emerald-800">
              Gross Salary (CTC)
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatINR(gross)}
            </span>
          </div>
        </div>
      </div>

      {/* Deductions table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Deductions
        </p>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {[
            {
              label: "PF — Employee Contribution",
              value: `${salary.pf_employee_pct}%`,
            },
            {
              label: "PF — Employer Contribution",
              value: `${salary.pf_employer_pct}%`,
            },
            {
              label: "Professional Tax",
              value: formatINR(salary.professional_tax),
            },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className="text-sm font-semibold text-red-600">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Effective period */}
      <p className="text-xs text-slate-400">
        Effective from {formatDate(salary.effective_from)}
        {salary.effective_to
          ? ` to ${formatDate(salary.effective_to)}`
          : " (Current)"}
      </p>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "resume", label: "Resume", icon: FileText },
  { id: "private", label: "Private Info", icon: Info },
  { id: "salary", label: "Salary Info", icon: DollarSign, privileged: true },
];

export function EmployeeProfileView({ employee: emp, onBack }) {
  const { role } = useAuth();
  const canSeeSalary = role === "admin" || role === "payroll_officer";

  const visibleTabs = TABS.filter((t) => !t.privileged || canSeeSalary);
  const [activeTab, setActiveTab] = useState("resume");

  // Reset tab whenever a different employee is opened
  useEffect(() => {
    setActiveTab("resume");
  }, [emp?.id]);

  if (!emp) return null;

  const name = emp.user?.full_name || "Unknown";
  const color = getAvatarColor(name);

  return (
    <div className="space-y-6">
      {/* ── Back navigation ── */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Directory
      </button>

      {/* ── Profile Header Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Colour accent stripe */}
        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-violet-500 to-primary-600" />

        {/* Header body */}
        <div className="px-8 pt-6 pb-0">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">

            {/* ── LEFT: Avatar + identity fields ── */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* Avatar circle */}
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0`}
              >
                {getInitials(name)}
              </div>

              {/* Name + fields */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-3 truncate">
                  {name}
                </h1>
                <div className="space-y-0">
                  <IdentityField
                    label="Login ID"
                    value={emp.id?.slice(0, 8).toUpperCase()}
                  />
                  <IdentityField label="Email" value={emp.user?.email} />
                  <IdentityField label="Mobile" value={emp.phone} />
                </div>
              </div>
            </div>

            {/* Vertical divider (md+) */}
            <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

            {/* ── RIGHT: Org fields ── */}
            <div className="md:w-56 space-y-3 pb-6">
              <OrgField label="Company" value="EmPay Technologies" />
              <OrgField label="Department" value={emp.department} />
              <OrgField
                label="Manager"
                value={emp.manager_id ? "—" : "—"}
              />
              <OrgField
                label="Employment"
                value={emp.employment_type?.replace(/_/g, " ")}
              />
            </div>
          </div>
        </div>

        {/* ── Tab bar — attached to the card bottom ── */}
        <div className="flex border-t border-slate-200 mt-2 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all",
                  isActive
                    ? "border-primary-600 text-primary-600 bg-primary-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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
      <div>
        {activeTab === "resume" && <ResumeTab emp={emp} />}
        {activeTab === "private" && <PrivateInfoTab emp={emp} />}
        {activeTab === "salary" && canSeeSalary && (
          <SalaryInfoTab employeeId={emp.id} />
        )}
      </div>
    </div>
  );
}
