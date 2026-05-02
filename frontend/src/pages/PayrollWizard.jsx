import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { DataTable } from "../components/ui/DataTable";
import api from "../api/axios";

// Helper for currency
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function PayrollWizard() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const onPreview = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/payroll/preview", {
        period_start: data.period_start,
        period_end: data.period_end,
      });
      setPreviewData(res.data);
      setCurrentPeriod({ ...data });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const onCommit = async () => {
    if (!currentPeriod) return;
    setCommitting(true);
    try {
      await api.post("/payroll/commit", {
        period_start: currentPeriod.period_start,
        period_end: currentPeriod.period_end,
      });
      toast.success("Payrun locked and committed successfully!");
      setPreviewData(null);
      setCurrentPeriod(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to commit payrun");
    } finally {
      setCommitting(false);
    }
  };

  const columns = [
    { header: "Employee", accessor: "employee_name", render: row => <span className="font-medium text-slate-900">{row.employee_name}</span> },
    { header: "Gross Pay", accessor: "gross_salary", render: row => formatCurrency(row.gross_salary) },
    { header: "PF Deduction", accessor: "pf_employee", render: row => <span className="text-slate-500">-{formatCurrency(row.pf_employee)}</span> },
    { header: "PT Deduction", accessor: "professional_tax", render: row => <span className="text-slate-500">-{formatCurrency(row.professional_tax)}</span> },
    { header: "LOP (Unpaid)", accessor: "lop_deduction", render: row => {
        const lopAmount = row.gross_salary - row.net_pay - row.pf_employee - row.professional_tax;
        return lopAmount > 0 ? <span className="text-red-500">-{formatCurrency(lopAmount)}</span> : "—";
    }},
    { header: "Net Pay", accessor: "net_pay", render: row => <span className="font-bold text-emerald-600">{formatCurrency(row.net_pay)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Payrun"
        description="Preview payslip calculations and commit final payruns."
      />

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Payrun Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onPreview)} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                type="date"
                label="Period Start"
                {...register("period_start", { required: "Required" })}
                error={errors.period_start?.message}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                label="Period End"
                {...register("period_end", { required: "Required" })}
                error={errors.period_end?.message}
              />
            </div>
            <Button type="submit" isLoading={loading} className="mb-1">
              Preview Payrun
            </Button>
          </form>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Payrun Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={previewData}
              emptyMessage="No employees eligible for this payrun."
            />
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <Button onClick={onCommit} isLoading={committing} className="bg-primary-700 hover:bg-primary-800">
                Lock & Commit Payrun
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
