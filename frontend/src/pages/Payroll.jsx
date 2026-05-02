import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Check,
  Download,
  FileText,
  Play,
  Plus,
  Printer,
  X as XIcon,
  Clock,
  ArrowLeft
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import api from "../api/axios";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";

// Helper for currency
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function fmtDate(d) {
  if (!d) return "—";
  try {
    return format(parseISO(d), "dd MMM yyyy");
  } catch {
    return d;
  }
}

// Review Modal for Leave Approvals
function ReviewModal({ request, onClose, onDone }) {
  const [action, setAction] = useState(null); // "approved" | "rejected"
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (chosenAction) => {
    setAction(chosenAction);
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/leave-requests/${request.id}/review`, {
        action: chosenAction,
        review_remarks: remarks || null,
      });
      onDone(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Action failed.");
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={!!request} onClose={onClose} title="Review Leave Request">
      <div className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
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
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Remarks</label>
          <textarea
            rows={2}
            className="w-full rounded-md border border-slate-300 p-2 text-sm"
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
            <Check className="w-4 h-4 mr-1.5" /> Approve
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={loading && action === "rejected"}
            disabled={loading}
            onClick={() => submit("rejected")}
          >
            <XIcon className="w-4 h-4 mr-1.5" /> Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Generate Payrun Wizard Modal
function CreatePayrunModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setError(null);
    try {
      const res = await api.post("/admin/payroll/payruns", data);
      onSuccess(res.data);
      reset();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create payrun");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Payrun">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        <Input
          label="Period Label (e.g., Oct 2025)"
          {...register("period_label", { required: "Required" })}
          error={errors.period_label?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Period Start"
            {...register("period_start", { required: "Required" })}
            error={errors.period_start?.message}
          />
          <Input
            type="date"
            label="Period End"
            {...register("period_end", { required: "Required" })}
            error={errors.period_end?.message}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Generate Draft</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [payruns, setPayruns] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [detailTab, setDetailTab] = useState("worked-days");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [prRes, lrRes] = await Promise.all([
        api.get("/admin/payroll/payruns"),
        api.get("/leave-requests/?status=pending")
      ]);
      setPayruns(prRes.data || []);
      setPendingLeaves(lrRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const loadPayslips = async (payrun) => {
    setSelectedPayrun(payrun);
    setSelectedPayslip(null);
    try {
      const res = await api.get(`/admin/payroll/payruns/${payrun.id}/payslips`);
      setPayslips(res.data || []);
      if (res.data?.length > 0) {
        setSelectedPayslip(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessPayrun = async (payrunId) => {
    setProcessingId(payrunId);
    try {
      const res = await api.post(`/admin/payroll/payruns/${payrunId}/process`);
      setPayruns(prev => prev.map(p => p.id === payrunId ? res.data : p));
      if (selectedPayrun?.id === payrunId) {
        setSelectedPayrun(res.data);
        loadPayslips(res.data);
      }
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to process payrun");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewDone = (updatedLeave) => {
    setPendingLeaves(prev => prev.filter(l => l.id !== updatedLeave.id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Process payruns, manage salary structures, and generate payslips."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setActiveTab("dashboard"); setSelectedPayrun(null); }}
              className={activeTab === "dashboard" ? "bg-primary-50 text-primary-700" : ""}
            >
              Dashboard
            </Button>
            <Button variant="secondary" onClick={() => { setActiveTab("payrun"); }}
              className={activeTab === "payrun" ? "bg-primary-50 text-primary-700" : ""}
            >
              Payruns
            </Button>
          </div>
        }
      />

      <CreatePayrunModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newPayrun) => {
          setPayruns([newPayrun, ...payruns]);
          setActiveTab("payrun");
        }}
      />

      <ReviewModal
        request={reviewingLeave}
        onClose={() => setReviewingLeave(null)}
        onDone={handleReviewDone}
      />

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Leave Requests
                </CardTitle>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                  {pendingLeaves.length} Pending
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {pendingLeaves.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No pending leaves to approve.</div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {pendingLeaves.map(leave => (
                      <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-medium text-sm text-slate-900">{leave.employee_name}</div>
                          <div className="text-xs text-slate-500">{leave.leave_type_name} • {fmtDate(leave.start_date)} to {fmtDate(leave.end_date)}</div>
                        </div>
                        <Button size="sm" onClick={() => setReviewingLeave(leave)}>Review</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Recent Payruns</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payruns.slice(0, 5).length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No payruns generated yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {payruns.slice(0, 5).map((pr) => (
                      <div key={pr.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-medium text-sm text-slate-900">{pr.period_label}</div>
                          <div className="text-xs text-slate-500 capitalize">{pr.status}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => { setActiveTab("payrun"); loadPayslips(pr); }}>
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "payrun" && !selectedPayrun && (
        <Card>
          <CardHeader className="border-b border-slate-100 flex items-center justify-between">
            <CardTitle>All Payruns</CardTitle>
            <Button size="sm" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" /> Generate Payrun
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3">Label</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created At</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payruns.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No payruns found.</td></tr>
                  )}
                  {payruns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => loadPayslips(pr)}>
                      <td className="px-6 py-4 font-medium">{pr.period_label}</td>
                      <td className="px-6 py-4">{fmtDate(pr.period_start)} to {fmtDate(pr.period_end)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pr.status === "finalized" ? "approved" : pr.status === "processing" ? "pending" : "draft"} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">{fmtDate(pr.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {pr.status === "draft" && (
                          <Button size="sm" variant="secondary" 
                            isLoading={processingId === pr.id}
                            onClick={(e) => { e.stopPropagation(); handleProcessPayrun(pr.id); }}
                          >
                            Compute
                          </Button>
                        )}
                        {pr.status === "finalized" && (
                          <span className="text-xs text-emerald-600 font-medium">Finalized</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "payrun" && selectedPayrun && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500" onClick={() => setSelectedPayrun(null)}>
              <ArrowLeft className="w-4 h-4" /> Back to Payruns
            </Button>
            <div className="flex gap-2">
              {selectedPayrun.status === "draft" && (
                <Button size="sm" 
                  isLoading={processingId === selectedPayrun.id}
                  onClick={() => handleProcessPayrun(selectedPayrun.id)}
                >
                  Compute Payrun
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payslips List */}
            <Card className="lg:col-span-1 h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-100 py-4 shrink-0">
                <CardTitle className="text-base">{selectedPayrun.period_label} Payslips</CardTitle>
                <div className="text-xs text-slate-500 mt-1">{payslips.length} employees processed</div>
              </CardHeader>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {payslips.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500">No payslips generated yet. Click Compute to generate.</div>
                )}
                {payslips.map(ps => (
                  <button key={ps.id} 
                    onClick={() => setSelectedPayslip(ps)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPayslip?.id === ps.id ? "bg-primary-50 border-primary-200" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-900">{ps.employee_name}</div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Net Pay</span>
                      <span className="font-medium text-slate-700">{formatCurrency(ps.net_pay)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Payslip Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedPayslip ? (
                <>
                  <Card>
                    <CardHeader className="border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 py-4">
                      <CardTitle className="text-base">Payslip Details</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant={detailTab === "worked-days" ? "secondary" : "ghost"}
                          onClick={() => setDetailTab("worked-days")}
                        >
                          Worked Days
                        </Button>
                        <Button size="sm" variant={detailTab === "salary" ? "secondary" : "ghost"}
                          onClick={() => setDetailTab("salary")}
                        >
                          Salary Computation
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {detailTab === "worked-days" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4 text-center mb-6">
                            <div className="bg-slate-50 p-3 rounded-lg border">
                              <div className="text-xs text-slate-500">Total Working Days</div>
                              <div className="text-lg font-semibold text-slate-900">{selectedPayslip.working_days}</div>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                              <div className="text-xs text-emerald-600">Present</div>
                              <div className="text-lg font-semibold text-emerald-700">{selectedPayslip.present_days}</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <div className="text-xs text-blue-600">Paid + Sick Leaves</div>
                              <div className="text-lg font-semibold text-blue-700">{selectedPayslip.leave_days - selectedPayslip.lop_days}</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                              <div className="text-xs text-red-600">Loss of Pay (LOP)</div>
                              <div className="text-lg font-semibold text-red-700">{selectedPayslip.lop_days}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {detailTab === "salary" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 text-xs font-semibold text-slate-500 uppercase pb-2 border-b">
                            <span>Earnings</span>
                            <span className="text-right">Amount</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Basic Salary</span>
                              <span>{formatCurrency(selectedPayslip.basic_salary)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>House Rent Allowance (HRA)</span>
                              <span>{formatCurrency(selectedPayslip.hra)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Other Allowances</span>
                              <span>{formatCurrency(selectedPayslip.other_allowances)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold pt-2 border-t text-slate-900">
                              <span>Gross Earnings</span>
                              <span>{formatCurrency(selectedPayslip.gross_salary)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 text-xs font-semibold text-slate-500 uppercase pb-2 border-b mt-6">
                            <span>Deductions</span>
                            <span className="text-right">Amount</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>PF Employee</span>
                              <span>-{formatCurrency(selectedPayslip.pf_employee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Professional Tax</span>
                              <span>-{formatCurrency(selectedPayslip.professional_tax)}</span>
                            </div>
                            {selectedPayslip.lop_days > 0 && (
                              <div className="flex justify-between text-sm text-red-600">
                                <span>Loss of Pay Deduction</span>
                                <span>-{formatCurrency(selectedPayslip.gross_salary - selectedPayslip.net_pay - selectedPayslip.pf_employee - selectedPayslip.professional_tax)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold pt-2 border-t text-slate-900">
                              <span>Total Deductions</span>
                              <span>-{formatCurrency(selectedPayslip.total_deductions)}</span>
                            </div>
                          </div>

                          <div className="flex justify-between text-base font-bold bg-primary-50 text-primary-900 p-4 rounded-lg mt-6">
                            <span>Net Payable</span>
                            <span>{formatCurrency(selectedPayslip.net_pay)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="bg-slate-50 border rounded-xl h-full flex items-center justify-center text-slate-400 text-sm">
                  Select a payslip to view details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
