import { useState, useEffect } from "react";
import { Download, FileText, Clock, Calendar, Briefcase, Printer } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../api/axios.js";
import { cn } from "../utils/cn.js";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TABS = [
  { id: "leaves", label: "Leave Report", icon: Calendar },
  { id: "attendance", label: "Attendance Report", icon: Clock },
  { id: "payslips", label: "Salary Statements", icon: Briefcase },
];

const PDF_THEME = {
  primary: [79, 70, 229],
  primaryDark: [55, 48, 163],
  slate: [15, 23, 42],
  muted: [100, 116, 139],
  success: [16, 185, 129],
  danger: [244, 63, 94],
  warning: [245, 158, 11],
  border: [226, 232, 240],
  surface: [248, 250, 252],
};

const formatPdfMoney = (value) => `Rs. ${new Intl.NumberFormat("en-IN").format(value || 0)}`;

const formatPdfDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPdfDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const drawPdfHeader = (doc, title, subtitle) => {
  doc.setFillColor(...PDF_THEME.primaryDark);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EmPay Technologies", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 20);
  if (subtitle) {
    doc.text(subtitle, 14, 25);
  }
  doc.setTextColor(...PDF_THEME.slate);
};

const drawStatCard = (doc, x, y, width, label, value, accent = PDF_THEME.primary) => {
  doc.setDrawColor(...PDF_THEME.border);
  doc.setFillColor(...PDF_THEME.surface);
  doc.roundedRect(x, y, width, 18, 2, 2, "FD");
  doc.setTextColor(...PDF_THEME.muted);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 3, y + 6);
  doc.setTextColor(...accent);
  doc.setFontSize(11);
  doc.text(String(value), x + 3, y + 13);
  doc.setTextColor(...PDF_THEME.slate);
};

const drawInfoBlock = (doc, x, y, label, value, width = 90) => {
  doc.setDrawColor(...PDF_THEME.border);
  doc.roundedRect(x, y, width, 10, 1, 1, "S");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(label, x + 3, y + 4);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_THEME.slate);
  doc.text(String(value || "-"), x + 3, y + 8);
};

function LeavesTab({ employees }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `/admin/reports/leave?year=${year}${employeeId ? `&employee_id=${employeeId}` : ""}`;
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load leave report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, employeeId]);

  const handleExportCSV = async () => {
    try {
      const urlParams = `/admin/reports/leave/export?year=${year}${employeeId ? `&employee_id=${employeeId}` : ""}`;
      const res = await api.get(urlParams, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave_report_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to export report");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const selectedEmployee = employees.find((emp) => emp.id === employeeId);
    const employeeLabel = selectedEmployee ? selectedEmployee.user?.full_name || selectedEmployee.id : "All Employees";
    drawPdfHeader(doc, "Leave Report", `${year} | ${employeeLabel}`);

    const summary = data.reduce(
      (accumulator, row) => {
        accumulator.allocated += Number(row.allocated_days || 0);
        accumulator.used += Number(row.used_days || 0);
        accumulator.pending += Number(row.pending_days || 0);
        accumulator.remaining += Number(row.remaining_days || 0);
        return accumulator;
      },
      { allocated: 0, used: 0, pending: 0, remaining: 0 },
    );

    drawStatCard(doc, 14, 34, 42, "Allocated", summary.allocated, PDF_THEME.primaryDark);
    drawStatCard(doc, 58, 34, 42, "Used", summary.used, PDF_THEME.warning);
    drawStatCard(doc, 102, 34, 42, "Pending", summary.pending, PDF_THEME.danger);
    drawStatCard(doc, 146, 34, 50, "Remaining", summary.remaining, PDF_THEME.success);

    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(`Generated on ${formatPdfDateTime(new Date())}`, 14, 58);

    autoTable(doc, {
      head: [["Employee", "Department", "Leave Type", "Allocated", "Used", "Pending", "Remaining"]],
      body: data.map((row) => [
        row.employee_name,
        row.department || "-",
        row.leave_type,
        row.allocated_days,
        row.used_days,
        row.pending_days,
        row.remaining_days,
      ]),
      startY: 64,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: PDF_THEME.slate },
      headStyles: { fillColor: PDF_THEME.primary, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: PDF_THEME.border,
      tableLineWidth: 0.2,
    });

    doc.save(`leave_report_${year}${employeeId ? `_${employeeId}` : ""}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Leave Report</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={employeeId} 
            onChange={e => setEmployeeId(e.target.value)}
            className="h-9 min-w-37.5 rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.user?.full_name || emp.id}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-300 px-3 text-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <FileText className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Employee</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Leave Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Allocated</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Used</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Pending</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No data found for this selection.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.employee_name}</td>
                      <td className="px-6 py-4 text-slate-600">{row.department || "-"}</td>
                      <td className="px-6 py-4 text-slate-600">{row.leave_type}</td>
                      <td className="px-6 py-4 text-slate-600">{row.allocated_days}</td>
                      <td className="px-6 py-4 text-slate-600">{row.used_days}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">{row.pending_days}</td>
                      <td className="px-6 py-4 text-primary-600 font-medium">{row.remaining_days}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttendanceTab({ employees }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `/admin/reports/attendance?month=${month}&year=${year}${employeeId ? `&employee_id=${employeeId}` : ""}`;
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load attendance report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year, employeeId]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
    const selectedEmployee = employees.find((emp) => emp.id === employeeId);
    const employeeLabel = selectedEmployee ? selectedEmployee.user?.full_name || selectedEmployee.id : "All Employees";
    drawPdfHeader(doc, "Attendance Report", `${monthName} ${year} | ${employeeLabel}`);

    const summary = data.reduce(
      (accumulator, row) => {
        accumulator.present += Number(row.present_days || 0);
        accumulator.absent += Number(row.absent_days || 0);
        accumulator.half += Number(row.half_days || 0);
        accumulator.late += Number(row.late_days || 0);
        return accumulator;
      },
      { present: 0, absent: 0, half: 0, late: 0 },
    );

    drawStatCard(doc, 14, 34, 42, "Present", summary.present, PDF_THEME.success);
    drawStatCard(doc, 58, 34, 42, "Absent", summary.absent, PDF_THEME.danger);
    drawStatCard(doc, 102, 34, 42, "Half Days", summary.half, PDF_THEME.warning);
    drawStatCard(doc, 146, 34, 50, "Late Days", summary.late, PDF_THEME.primaryDark);

    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(`Generated on ${formatPdfDateTime(new Date())}`, 14, 58);

    autoTable(doc, {
      head: [["Employee", "Department", "Present", "Absent", "Half Days", "Late Days"]],
      body: data.map((row) => [
        row.employee_name,
        row.department || "-",
        row.present_days,
        row.absent_days,
        row.half_days,
        row.late_days,
      ]),
      startY: 64,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: PDF_THEME.slate },
      headStyles: { fillColor: PDF_THEME.primary, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: PDF_THEME.border,
      tableLineWidth: 0.2,
    });

    doc.save(`attendance_report_${year}_${month}${employeeId ? `_${employeeId}` : ""}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Attendance Report</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={employeeId} 
            onChange={e => setEmployeeId(e.target.value)}
            className="h-9 min-w-37.5 rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.user?.full_name || emp.id}</option>
            ))}
          </select>
          <select 
            value={month} 
            onChange={e => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-300 px-3 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-300 px-3 text-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Employee</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Present Days</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Absent Days</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Half Days</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Late Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No data found for this period.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.employee_name}</td>
                      <td className="px-6 py-4 text-slate-600">{row.department || "-"}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">{row.present_days}</td>
                      <td className="px-6 py-4 text-rose-600 font-medium">{row.absent_days}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">{row.half_days}</td>
                      <td className="px-6 py-4 text-slate-600">{row.late_days}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PayslipsTab() {
  const [payruns, setPayruns] = useState([]);
  const [selectedPayrunId, setSelectedPayrunId] = useState("");
  const [payslips, setPayslips] = useState([]);
  const [loadingPayruns, setLoadingPayruns] = useState(true);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayruns = async () => {
      setLoadingPayruns(true);
      setError("");
      try {
        const res = await api.get("/admin/payroll/payruns");
        const payrunList = res.data || [];
        setPayruns(payrunList);

        if (payrunList.length > 0) {
          const preferredPayrun =
            payrunList.find((payrun) => ["paid", "finalized", "processing"].includes(payrun.status)) ||
            payrunList[0];
          setSelectedPayrunId(preferredPayrun.id);
        } else {
          setSelectedPayrunId("");
          setPayslips([]);
        }
      } catch (err) {
        console.error("Failed to load payruns", err);
        setError("Failed to load payruns.");
      } finally {
        setLoadingPayruns(false);
      }
    };

    fetchPayruns();
  }, []);

  useEffect(() => {
    const fetchPayslips = async () => {
      if (!selectedPayrunId) {
        setPayslips([]);
        return;
      }

      setLoadingPayslips(true);
      setError("");
      try {
        const res = await api.get(`/admin/payroll/payruns/${selectedPayrunId}/payslips`);
        setPayslips(res.data || []);
      } catch (err) {
        console.error("Failed to load payslips", err);
        setError("Failed to load payslips for the selected payrun.");
        setPayslips([]);
      } finally {
        setLoadingPayslips(false);
      }
    };

    fetchPayslips();
  }, [selectedPayrunId]);

  const selectedPayrun = payruns.find((payrun) => payrun.id === selectedPayrunId) || null;

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const downloadPayslip = (payslip) => {
    const doc = new jsPDF("l", "mm", "a4"); // landscape orientation for better table width
    const payPeriod = payslip.pay_period || selectedPayrun?.period_label || "Salary Statement";

    // Custom header for landscape
    doc.setFillColor(...PDF_THEME.primaryDark);
    doc.rect(0, 0, 297, 28, "F"); // landscape width
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EmPay Technologies", 14, 12);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Payslip", 14, 20);
    doc.text(payPeriod, 14, 25);
    doc.setTextColor(...PDF_THEME.slate);

    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(`Generated on ${formatPdfDateTime(payslip.generated_at || new Date())}`, 14, 34);

    drawInfoBlock(doc, 14, 40, "Employee Name", payslip.employee_name, 100);
    drawInfoBlock(doc, 120, 40, "Employee ID", payslip.employee_code || payslip.employee_id, 100);
    drawInfoBlock(doc, 226, 40, "Department", payslip.department || "-", 60);
    drawInfoBlock(doc, 14, 52, "Designation", payslip.designation || "-", 100);
    drawInfoBlock(doc, 120, 52, "Date of Joining", formatPdfDate(payslip.date_of_joining), 100);
    drawInfoBlock(doc, 226, 52, "Bank Account", payslip.bank_details?.account_number || "-", 60);
    drawInfoBlock(doc, 14, 64, "UAN Number", payslip.uan_number || "-", 100);
    drawInfoBlock(doc, 120, 64, "PAN Number", payslip.pan_number || "-", 100);
    drawInfoBlock(doc, 226, 64, "Status", payslip.status || "-", 60);

    drawStatCard(doc, 14, 78, 50, "Working Days", payslip.working_days, PDF_THEME.primaryDark);
    drawStatCard(doc, 68, 78, 50, "Paid Days", Number(payslip.working_days || 0) - Number(payslip.lop_days || 0), PDF_THEME.success);
    drawStatCard(doc, 122, 78, 50, "LOP Days", payslip.lop_days, PDF_THEME.danger);
    drawStatCard(doc, 176, 78, 50, "Net Pay", formatPdfMoney(payslip.net_pay), PDF_THEME.primary);
    drawStatCard(doc, 230, 78, 56, "Gross Salary", formatPdfMoney(payslip.gross_salary), PDF_THEME.primaryDark);

    autoTable(doc, {
      startY: 100,
      head: [
        [
          { content: "Earnings", halign: "left" },
          { content: "Amount", halign: "right" },
          { content: "Deductions", halign: "left" },
          { content: "Amount", halign: "right" },
        ],
      ],
      body: [
        ["Basic Salary", formatPdfMoney(payslip.basic_salary), "PF (Employee)", formatPdfMoney(payslip.pf_employee)],
        ["HRA", formatPdfMoney(payslip.hra), "Professional Tax", formatPdfMoney(payslip.professional_tax)],
        ["Other Allowances", formatPdfMoney(payslip.other_allowances), "Total Deductions", formatPdfMoney(payslip.total_deductions)],
        ["Gross Salary", formatPdfMoney(payslip.gross_salary), "Net Pay", formatPdfMoney(payslip.net_pay)],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: PDF_THEME.slate, overflow: "linebreak" },
      headStyles: { fillColor: PDF_THEME.primary, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: "right" },
        2: { cellWidth: 60 },
        3: { cellWidth: 50, halign: "right" },
      },
      tableLineColor: PDF_THEME.border,
      tableLineWidth: 0.2,
    });

    doc.setFillColor(...PDF_THEME.slate);
    doc.roundedRect(14, doc.lastAutoTable.finalY + 8, 269, 16, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Net Salary Payable", 20, doc.lastAutoTable.finalY + 18);
    doc.setFontSize(18);
    doc.text(formatPdfMoney(payslip.net_pay), 270, doc.lastAutoTable.finalY + 18, { align: "right" });
    doc.setTextColor(...PDF_THEME.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("This is a computer-generated payslip and does not require a signature.", 14, doc.lastAutoTable.finalY + 30);

    doc.save(`Payslip_${(payslip.employee_code || payslip.employee_name || "employee").replace(/\s+/g, "_")}_${String(payPeriod).replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Salary Statements</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Generated payslips from processed payruns.</p>
        </div>
        <select
          value={selectedPayrunId}
          onChange={(event) => setSelectedPayrunId(event.target.value)}
          className="h-9 min-w-60 rounded-md border border-slate-300 px-3 text-sm"
          disabled={loadingPayruns || payruns.length === 0}
        >
          {payruns.length === 0 ? (
            <option value="">No payruns available</option>
          ) : (
            payruns.map((payrun) => (
              <option key={payrun.id} value={payrun.id}>
                {payrun.period_label} - {payrun.status}
              </option>
            ))
          )}
        </select>
      </CardHeader>
      <CardContent className="p-0">
        {loadingPayruns ? (
          <div className="p-8 text-center text-slate-500">Loading payruns...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">{error}</div>
        ) : payruns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No payruns found. Generate and process a payrun in Payroll first.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-6 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payrun</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedPayrun?.period_label || "-"}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</div>
                <div className="mt-1 text-sm font-medium text-slate-900 capitalize">{selectedPayrun?.status || "-"}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payslips</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{payslips.length} generated</div>
              </div>
            </div>

            {loadingPayslips ? (
              <div className="p-8 text-center text-slate-500">Loading payslips...</div>
            ) : payslips.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No payslips found for this payrun yet. Process the payrun to generate them.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700">Employee</th>
                      <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                      <th className="px-6 py-4 font-semibold text-slate-700">Period</th>
                      <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-right">Net Pay</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-right">Generated</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{payslip.employee_name}</td>
                        <td className="px-6 py-4 text-slate-600">{payslip.department || "-"}</td>
                        <td className="px-6 py-4 text-slate-600">{payslip.pay_period || selectedPayrun?.period_label || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 capitalize">
                            {payslip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(payslip.net_pay || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          {payslip.generated_at ? new Date(payslip.generated_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadPayslip(payslip)}
                          >
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("leaves");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employees for dropdown filters
    api.get("/api/v1/employees")
      .then(res => {
        if (res.data) {
          setEmployees(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(err => {
        // Silently fail - reports work without employee filter
        console.warn("Employee filter unavailable", err.response?.status || err.message);
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="View and export aggregated data across leaves, attendance, and payroll."
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all",
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

        <div className="p-6">
          {activeTab === "leaves" && <LeavesTab employees={employees} />}
          {activeTab === "attendance" && <AttendanceTab employees={employees} />}
          {activeTab === "payslips" && <PayslipsTab />}
        </div>
      </div>
    </div>
  );
}
