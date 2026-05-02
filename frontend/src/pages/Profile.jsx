import { useEffect, useState } from "react";
import {
  FileText,
  Info,
  Lock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  Calendar,
  Shield,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../utils/cn";
import useAuth from "../hooks/useAuth.js";
import api from "../api/axios.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

const TABS = [
  { id: "resume", label: "Resume", icon: FileText },
  { id: "private", label: "Private Info", icon: Info },
  { id: "security", label: "Security", icon: Lock },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function ResumeTab({ profile, user }) {
  const skillTags = [
    profile?.department,
    profile?.designation,
    profile?.employment_type?.replace(/_/g, " "),
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — bio */}
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2">About</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {profile?.designation
              ? `${user?.full_name} currently serves as ${profile.designation}${
                  profile.department
                    ? ` in the ${profile.department} department`
                    : ""
                }.`
              : "No biographical information has been added yet."}
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            What I do at work
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {profile?.department
              ? `Working in the ${profile.department} department${
                  profile.designation ? ` as ${profile.designation}` : ""
                }.`
              : "No additional work information provided."}
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            Tenure
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {profile?.date_of_joining
              ? `Joined the organisation on ${formatDate(
                  profile.date_of_joining
                )}.`
              : "Joining date has not been recorded."}
          </p>
        </section>
      </div>

      {/* Right — Skills & Certifications */}
      <div className="space-y-4">
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

function PrivateInfoTab({ profile, user }) {
  const rows = [
    { icon: Hash, label: "Employee ID", value: profile?.id },
    { icon: Users, label: "Full Name", value: user?.full_name },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Mobile", value: profile?.phone },
    { icon: Building2, label: "Department", value: profile?.department },
    { icon: Briefcase, label: "Designation", value: profile?.designation },
    {
      icon: Users,
      label: "Employment",
      value: profile?.employment_type?.replace(/_/g, " "),
    },
    {
      icon: Calendar,
      label: "Joined On",
      value: formatDate(profile?.date_of_joining),
    },
    {
      icon: Shield,
      label: "System Role",
      value: user?.role?.replace(/_/g, " "),
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
            <span className="text-sm text-slate-800 font-medium truncate capitalize">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared: Password Input field ───────────────────────────────────────────
// Must be defined at module scope (NOT inside another component) so React
// treats it as a stable component type and never remounts it on re-render.

function PasswordInput({ label, placeholder, value, onChange, show, onToggleShow }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full pr-10 pl-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Security (Change Password) ─────────────────────────────────────────

function SecurityTab({ user }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [result, setResult] = useState(null); // { type, msg }
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleShow = (key) => () =>
    setShow((s) => ({ ...s, [key]: !s[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (form.new_password.length < 8) {
      setResult({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setResult({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/change-password`, {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setResult({ type: "success", msg: "Password changed successfully!" });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setResult({
        type: "error",
        msg: err?.response?.data?.detail || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Info banner */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Change Your Password</p>
          <p className="text-xs text-amber-600 mt-0.5">
            You must provide your current password to set a new one.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="Current Password"
          placeholder="Enter current password"
          value={form.current_password}
          onChange={handleChange("current_password")}
          show={show.current}
          onToggleShow={toggleShow("current")}
        />
        <PasswordInput
          label="New Password"
          placeholder="At least 8 characters"
          value={form.new_password}
          onChange={handleChange("new_password")}
          show={show.new}
          onToggleShow={toggleShow("new")}
        />
        <PasswordInput
          label="Confirm New Password"
          placeholder="Repeat new password"
          value={form.confirm_password}
          onChange={handleChange("confirm_password")}
          show={show.confirm}
          onToggleShow={toggleShow("confirm")}
        />

        {result && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              result.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {result.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {result.msg}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("resume");

  // Fetch the user's own employee profile
  useEffect(() => {
    api
      .get("/employees/me")
      .then((r) => setProfile(r.data))
      .catch(() => setProfile(null));
  }, []);

  const name = user?.full_name || "My Profile";
  const color = getAvatarColor(name);

  return (
    <div className="space-y-6">
      {/* ── Profile Header Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Accent stripe */}
        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-violet-500 to-primary-600" />

        <div className="px-8 pt-6 pb-0">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">

            {/* LEFT: Avatar + identity */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* Large circular avatar */}
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0`}
              >
                {getInitials(name)}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-3 truncate">
                  {name}
                </h1>
                <div className="space-y-0">
                  <IdentityField
                    label="Login ID"
                    value={profile?.id?.slice(0, 8).toUpperCase() || "—"}
                  />
                  <IdentityField label="Email" value={user?.email} />
                  <IdentityField label="Mobile" value={profile?.phone} />
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

            {/* RIGHT: Org info */}
            <div className="md:w-56 space-y-3 pb-6">
              <OrgField label="Company" value="EmPay Technologies" />
              <OrgField label="Department" value={profile?.department} />
              <OrgField label="Manager" value="—" />
              <OrgField
                label="Employment"
                value={profile?.employment_type?.replace(/_/g, " ")}
              />
            </div>
          </div>
        </div>

        {/* Tab bar — attached to card bottom */}
        <div className="flex border-t border-slate-200 mt-2 overflow-x-auto">
          {TABS.map((tab) => {
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
        {activeTab === "resume" && (
          <ResumeTab profile={profile} user={user} />
        )}
        {activeTab === "private" && (
          <PrivateInfoTab profile={profile} user={user} />
        )}
        {activeTab === "security" && <SecurityTab user={user} />}
      </div>
    </div>
  );
}
