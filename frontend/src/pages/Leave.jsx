import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Check,
  X,
  Clock,
  FileText,
  Users,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import useAuth from "../hooks/useAuth.js";
import api from "../api/axios.js";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { StatCard } from "../components/ui/StatCard";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "—";
  try {
    return format(parseISO(d), "dd MMM yyyy");
  } catch {
    return d;
  }
}

function Toast({ message, type = "error", onDismiss }) {
  if (!message) return null;
  const colours =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800";
  return (
    <div
      className={`flex items-start gap-3 border rounded-lg px-4 py-3 text-sm ${colours} animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS FILTER TABS
───────────────────────────────────────────── */
const STATUS_TABS = ["all", "pending", "approved", "rejected", "cancelled"];

function StatusTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {STATUS_TABS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${active === s
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPLY LEAVE MODAL (Employee)
───────────────────────────────────────────── */
function ApplyLeaveModal({ isOpen, onClose, leaveTypes, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();

  const [toast, setToast] = useState(null);

  const onSubmit = async (data) => {
    setToast(null);
    try {
      const res = await api.post("/leave-requests/", {
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
      });
      reset();
      onClose();
      onSuccess(res.data);
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Failed to submit leave request.";
      setToast(detail);
    }
  };

  const handleClose = () => {
    reset();
    setToast(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Leave Request">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {toast && (
          <Toast message={toast} onDismiss={() => setToast(null)} />
        )}

        {/* Leave Type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Time Off Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.leave_type_id ? "border-red-400" : "border-slate-300"
                }`}
              {...register("leave_type_id", { required: "Please select a leave type" })}
            >
              <option value="">Select leave type…</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {errors.leave_type_id && (
            <span className="text-xs text-red-500">{errors.leave_type_id.message}</span>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="From Date"
            {...register("start_date", { required: "Required" })}
            error={errors.start_date?.message}
          />
          <Input
            type="date"
            label="To Date"
            {...register("end_date", { required: "Required" })}
            error={errors.end_date?.message}
          />
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Reason / Note
          </label>
          <textarea
            rows={3}
            className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Brief reason for your leave request…"
            {...register("reason")}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Discard
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   REVIEW MODAL (Admin / Payroll)
───────────────────────────────────────────── */
function ReviewModal({ request, onClose, onDone }) {
  const [action, setAction] = useState(null); // "approved" | "rejected"
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const submit = async (chosenAction) => {
    setAction(chosenAction);
    setLoading(true);
    setToast(null);
    try {
      const res = await api.patch(`/leave-requests/${request.id}/review`, {
        action: chosenAction,
        review_remarks: remarks || null,
      });
      onDone(res.data);
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail || "Action failed.";
      setToast(detail);
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={!!request} onClose={onClose} title="Review Leave Request">
      <div className="space-y-4">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Employee</span>
            <span className="font-medium text-slate-900">{request.employee_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Leave Type</span>
            <span className="font-medium text-slate-900">{request.leave_type_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Period</span>
            <span className="font-medium text-slate-900">
              {fmtDate(request.start_date)} → {fmtDate(request.end_date)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Working Days</span>
            <span className="font-medium text-slate-900">{request.total_days}</span>
          </div>
          {request.reason && (
            <div className="pt-1 border-t border-slate-200">
              <span className="text-slate-500 block mb-1">Reason</span>
              <span className="italic text-slate-700">"{request.reason}"</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Review Remarks (optional)
          </label>
          <textarea
            rows={2}
            className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Add a note for the employee…"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            isLoading={loading && action === "approved"}
            disabled={loading}
            onClick={() => submit("approved")}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Approve
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={loading && action === "rejected"}
            disabled={loading}
            onClick={() => submit("rejected")}
          >
            <X className="w-4 h-4 mr-1.5" />
            Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   EMPLOYEE VIEW
═══════════════════════════════════════════════ */
function EmployeeLeaveView() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [statusTab, setStatusTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, reqRes, ltRes] = await Promise.all([
        api.get("/leave-balances/me"),
        api.get("/leave-requests/me"),
        api.get("/leave-types/"),
      ]);
      setBalances(balRes.data || []);
      setRequests(reqRes.data || []);
      setLeaveTypes(ltRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSuccess = (created) => {
    setRequests((prev) => [created, ...prev]);
    // refresh balances since service doesn't deduct on create (only on approval)
    api.get("/leave-balances/me").then((r) => setBalances(r.data || []));
  };

  const handleCancel = async (requestId) => {
    try {
      const res = await api.patch(`/leave-requests/${requestId}/cancel`);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? res.data : r))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filtered =
    statusTab === "all"
      ? requests
      : requests.filter((r) => r.status === statusTab);

  const columns = [
    {
      header: "Leave Type",
      accessor: "leave_type_name",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.leave_type_name}</span>
      ),
    },
    {
      header: "From",
      accessor: "start_date",
      render: (row) => fmtDate(row.start_date),
    },
    {
      header: "To",
      accessor: "end_date",
      render: (row) => fmtDate(row.end_date),
    },
    { header: "Days", accessor: "total_days" },
    { header: "Days", accessor: "total_days" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      accessor: "_actions",
      render: (row) =>
        row.status === "pending" ? (
          <button
            onClick={() => handleCancel(row.id)}
            className="text-xs text-slate-500 hover:text-red-600 hover:underline transition-colors"
          >
            Cancel
          </button>
        ) : null,
    },
  ];

  // Color map for balance cards
  const balanceColors = ["primary", "success", "warning", "purple", "danger"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Off"
        description="Manage your leave requests and view your leave balances."
        actions={
          <Button onClick={() => setModalOpen(true)} id="apply-leave-btn">
            <FileText className="w-4 h-4 mr-2" />
            Apply for Leave
          </Button>
        }
      />

      <ApplyLeaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        leaveTypes={leaveTypes}
        onSuccess={handleSuccess}
      />

      {/* Balance Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : balances.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500 text-sm">
            No leave balances allocated yet. Contact your HR Officer.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((b, i) => (
            <StatCard
              key={b.id}
              title={b.leave_type_name}
              value={`${b.remaining_days} days`}
              icon={Calendar}
              color={balanceColors[i % balanceColors.length]}
            />
          ))}
        </div>
      )}

      {/* My Leave History */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <CardTitle className="text-lg">My Leave History</CardTitle>
          <StatusTabs active={statusTab} onChange={setStatusTab} />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
              Loading…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyMessage="No leave requests found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HR OFFICER VIEW  (view-only, all employees)
═══════════════════════════════════════════════ */
function HRLeaveView() {
  const [requests, setRequests] = useState([]);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/leave-requests/")
      .then((r) => setRequests(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    const matchesStatus = statusTab === "all" || r.status === statusTab;
    const matchesSearch =
      !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.leave_type_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employee_name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
            {row.employee_name?.charAt(0) || "?"}
          </div>
          <span className="font-medium text-slate-900">{row.employee_name}</span>
        </div>
      ),
    },
    {
      header: "Leave Type",
      accessor: "leave_type_name",
      render: (row) => (
        <span className="font-medium text-slate-700">{row.leave_type_name}</span>
      ),
    },
    {
      header: "From",
      accessor: "start_date",
      render: (row) => fmtDate(row.start_date),
    },
    {
      header: "To",
      accessor: "end_date",
      render: (row) => fmtDate(row.end_date),
    },
    { header: "Days", accessor: "total_days" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Off"
        description="View all employee leave requests across the organization."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Approvals"
          value={counts.pending}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Approved"
          value={counts.approved}
          icon={Check}
          color="success"
        />
        <StatCard
          title="Rejected"
          value={counts.rejected}
          icon={X}
          color="danger"
        />
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              All Leave Requests
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="search"
                placeholder="Search employee or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-52"
              />
              <StatusTabs active={statusTab} onChange={setStatusTab} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
              Loading…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyMessage="No leave requests match your filters."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN / PAYROLL OFFICER VIEW  (approve + reject)
═══════════════════════════════════════════════ */
function AdminLeaveView() {
  const [requests, setRequests] = useState([]);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api
      .get("/leave-requests/")
      .then((r) => setRequests(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleReviewDone = (updated) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusTab === "all" || r.status === statusTab;
    const matchesSearch =
      !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.leave_type_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const columns = [
    {
      header: "Employee",
      accessor: "employee_name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
            {row.employee_name?.charAt(0) || "?"}
          </div>
          <span className="font-medium text-slate-900">{row.employee_name}</span>
        </div>
      ),
    },
    {
      header: "Leave Type",
      accessor: "leave_type_name",
      render: (row) => (
        <span className="font-medium text-slate-700">{row.leave_type_name}</span>
      ),
    },
    {
      header: "From",
      accessor: "start_date",
      render: (row) => fmtDate(row.start_date),
    },
    {
      header: "To",
      accessor: "end_date",
      render: (row) => fmtDate(row.end_date),
    },
    { header: "Days", accessor: "total_days" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      accessor: "_actions",
      render: (row) =>
        row.status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              id={`approve-${row.id}`}
              onClick={() => setReviewing(row)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              id={`reject-${row.id}`}
              onClick={() => {
                setReviewing(row);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 border border-red-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">
            {row.status === "approved" ? "Approved" : row.status === "rejected" ? "Rejected" : "—"}
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Off Management"
        description="Review and approve employee leave requests."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={counts.total}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Pending"
          value={counts.pending}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Approved"
          value={counts.approved}
          icon={Check}
          color="success"
        />
        <StatCard
          title="Rejected"
          value={counts.rejected}
          icon={X}
          color="danger"
        />
      </div>

      {/* Pending Banner */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
          <Clock className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">{counts.pending}</span> leave{" "}
            {counts.pending === 1 ? "request" : "requests"} awaiting your
            review.
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              All Leave Requests
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="search"
                placeholder="Search employee or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-52"
              />
              <StatusTabs active={statusTab} onChange={setStatusTab} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
              Loading…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyMessage="No leave requests match your filters."
            />
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {reviewing && (
        <ReviewModal
          request={reviewing}
          onClose={() => setReviewing(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT — role dispatch
═══════════════════════════════════════════════ */
export default function Leave() {
  const { role } = useAuth();

  if (role === "admin" || role === "payroll_officer") {
    return <AdminLeaveView />;
  }

  if (role === "hr_officer") {
    return <HRLeaveView />;
  }

  // employee (default)
  return <EmployeeLeaveView />;
}
