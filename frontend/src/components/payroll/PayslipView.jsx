import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function PayslipView({ payslipId, onBack }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const componentRef = useRef(null);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const res = await api.get(`/admin/payroll/payslips/${payslipId}`);
        setPayslip(res.data);
      } catch (err) {
        console.error("Failed to fetch payslip", err);
      } finally {
        setLoading(false);
      }
    };
    if (payslipId) fetchPayslip();
  }, [payslipId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!payslip) {
    return <div className="p-8 text-center text-slate-500">Payslip not found.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!componentRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${payslip.employee_code}_${payslip.pay_period || 'Period'}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsExporting(false);
    }
  };

  const earnings = [
    { label: "Basic Salary", amount: payslip.basic_salary },
    { label: "HRA", amount: payslip.hra },
    { label: "Other Allowances", amount: payslip.other_allowances },
  ].filter(i => parseFloat(i.amount) > 0);

  const deductions = [
    { label: "PF (Employee)", amount: payslip.pf_employee },
    { label: "Professional Tax", amount: payslip.professional_tax },
  ].filter(i => parseFloat(i.amount) > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            &larr; Back
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button onClick={handlePrint} variant="secondary">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" /> {isExporting ? "Generating..." : "PDF"}
          </Button>
        </div>
      </div>

      <div ref={componentRef}>
        <Card className="max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
        <CardContent className="p-8 sm:p-12 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EmPay Technologies</h1>
              </div>
              <p className="text-sm text-slate-500">Tech Park, Bengaluru, India</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Payslip</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">{payslip.pay_period || "Salary Statement"}</p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="space-y-4">
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Employee Name</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.employee_name}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Employee ID</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.employee_code || payslip.employee_id.split("-")[0]}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Designation</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.designation || "-"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Department</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.department || "-"}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Date of Joining</span>
                <span className="text-sm font-semibold text-slate-900">
                  {payslip.date_of_joining ? new Date(payslip.date_of_joining).toLocaleDateString() : "-"}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">UAN Number</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.uan_number || "-"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">PAN Number</span>
                <span className="text-sm font-semibold text-slate-900">{payslip.pan_number || "-"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm font-medium text-slate-500">Bank Account</span>
                <span className="text-sm font-semibold text-slate-900 uppercase">
                  {payslip.bank_details?.account_number || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="flex gap-12 border-y border-slate-200 py-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Days</span>
              <span className="text-lg font-bold text-slate-900">{payslip.working_days}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Paid Days</span>
              <span className="text-lg font-bold text-slate-900">{payslip.present_days + parseFloat(payslip.leave_days || 0)}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">LOP Days</span>
              <span className="text-lg font-bold text-rose-600">{payslip.lop_days}</span>
            </div>
          </div>

          {/* Salary Components */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Earnings */}
            <div>
              <div className="bg-emerald-50 rounded-t-lg px-4 py-2 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Earnings</h3>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg p-4 space-y-3">
                {earnings.map(e => (
                  <div key={e.label} className="flex justify-between items-center text-sm gap-4">
                    <span className="text-slate-600 truncate">{e.label}</span>
                    <span className="font-semibold text-slate-900 whitespace-nowrap tabular-nums pr-1">{formatMoney(e.amount)}</span>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-800">Total Earnings</span>
                  <span className="text-emerald-700 whitespace-nowrap tabular-nums pr-1">{formatMoney(payslip.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="bg-rose-50 rounded-t-lg px-4 py-2 border-b border-rose-100">
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Deductions</h3>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg p-4 space-y-3">
                {deductions.map(d => (
                  <div key={d.label} className="flex justify-between items-center text-sm gap-4">
                    <span className="text-slate-600 truncate">{d.label}</span>
                    <span className="font-semibold text-slate-900 whitespace-nowrap tabular-nums pr-1">{formatMoney(d.amount)}</span>
                  </div>
                ))}
                {deductions.length === 0 && (
                  <div className="text-sm text-slate-400 italic">No deductions</div>
                )}
                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-800">Total Deductions</span>
                  <span className="text-rose-700 whitespace-nowrap tabular-nums pr-1">{formatMoney(payslip.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Net Salary Payable</p>
              <p className="text-3xl font-bold tracking-tight tabular-nums">{formatMoney(payslip.net_pay)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {payslip.status === 'draft' ? 'DRAFT' : 'PAID'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-200 text-xs text-slate-400 space-y-1 print:mt-12">
            <p>This is a computer generated payslip and does not require a signature.</p>
            <p>Generated on {new Date(payslip.generated_at || Date.now()).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
