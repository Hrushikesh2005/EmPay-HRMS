import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import useAuth from "../hooks/useAuth.js";

const EMPLOYEE_OPTIONS = [
  { id: "EMP-1024", name: "Dev Nair", designation: "SDE II" },
  { id: "EMP-1025", name: "Priya Kapoor", designation: "Senior Analyst" },
  { id: "EMP-1026", name: "Rohan Joshi", designation: "UI Designer" },
];

const YEAR_OPTIONS = ["2024", "2025", "2026"];

const LEAVE_REPORT = [
  {
    employee: "Dev Nair",
    type: "Sick Leave",
    dates: "12 May - 13 May",
    days: 2,
    status: "Approved",
  },
  {
    employee: "Priya Kapoor",
    type: "Paid Leave",
    dates: "20 May - 25 May",
    days: 6,
    status: "Approved",
  },
  {
    employee: "Rohan Joshi",
    type: "Paid Leave",
    dates: "01 Jun - 05 Jun",
    days: 5,
    status: "Pending",
  },
];

const STATEMENT_DATA = {
  company: "EmPay Technologies",
  effectiveFrom: "01/01/2025",
  joinDate: "26/06/2017",
  location: "Pune, India",
  pan: "DPRxxxxx3",
  uan: "123492343232",
  bankAccount: "234923423432",
  earnings: [
    { label: "Basic", monthly: 12233, yearly: 146796 },
    { label: "HRA", monthly: 11233, yearly: 134796 },
    { label: "Performance Bonus", monthly: 3200, yearly: 38400 },
    { label: "Travel Allowance", monthly: 1800, yearly: 21600 },
  ],
  deductions: [
    { label: "PF", monthly: 1200, yearly: 14400 },
    { label: "Professional Tax", monthly: 200, yearly: 2400 },
    { label: "TDS", monthly: 1500, yearly: 18000 },
  ],
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Reports() {
  const { user } = useAuth();
  const role = user?.role;

  const [employeeId, setEmployeeId] = useState(EMPLOYEE_OPTIONS[0].id);
  const [year, setYear] = useState(YEAR_OPTIONS[1]);

  const selectedEmployee = useMemo(
    () => EMPLOYEE_OPTIONS.find((emp) => emp.id === employeeId),
    [employeeId],
  );

  const totalEarnings = useMemo(
    () => STATEMENT_DATA.earnings.reduce((sum, item) => sum + item.monthly, 0),
    [],
  );

  const totalDeductions = useMemo(
    () => STATEMENT_DATA.deductions.reduce((sum, item) => sum + item.monthly, 0),
    [],
  );

  const netSalary = totalEarnings - totalDeductions;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("PDF export can be wired to jsPDF or html2pdf next.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Statement Report"
        description="Select an employee and year to generate a salary statement report."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrint} variant="secondary">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Salary Statement Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Employee Name
              </label>
              <select
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                {EMPLOYEE_OPTIONS.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Year</label>
              <select
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              >
                {YEAR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-slate-300">
          <CardHeader className="border-b border-slate-100 print:border-slate-200">
            <CardTitle>Salary Statement Report Print</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {STATEMENT_DATA.company}
              </h3>
              <p className="text-sm text-slate-500">Salary Statement Report</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Employee Name:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {selectedEmployee?.name}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Designation:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {selectedEmployee?.designation}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Salary Effective From:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {STATEMENT_DATA.effectiveFrom}
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Date of Joining:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {STATEMENT_DATA.joinDate}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">UAN:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {STATEMENT_DATA.uan}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">PAN:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {STATEMENT_DATA.pan}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Salary Components</span>
                <span className="text-right">Monthly</span>
                <span className="text-right">Yearly</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Earnings</p>
              {STATEMENT_DATA.earnings.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-3 text-sm text-slate-700"
                >
                  <span>{item.label}</span>
                  <span className="text-right">{formatMoney(item.monthly)}</span>
                  <span className="text-right">{formatMoney(item.yearly)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Deductions</p>
              {STATEMENT_DATA.deductions.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-3 text-sm text-slate-700"
                >
                  <span>{item.label}</span>
                  <span className="text-right">{formatMoney(item.monthly)}</span>
                  <span className="text-right">{formatMoney(item.yearly)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 grid grid-cols-3 text-sm font-semibold">
              <span className="text-slate-900">Net Salary</span>
              <span className="text-right">{formatMoney(netSalary)}</span>
              <span className="text-right">{formatMoney(netSalary * 12)}</span>
            </div>

            <p className="text-xs text-slate-500">
              Report generated for {year}. Location: {STATEMENT_DATA.location}.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex items-center justify-between">
          <CardTitle>Leave Report</CardTitle>
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Employee</label>
              <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">All Employees</option>
                {EMPLOYEE_OPTIONS.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Year</label>
              <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm">
                {YEAR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {LEAVE_REPORT.map((row) => (
                  <tr key={`${row.employee}-${row.dates}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.employee}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.type}</td>
                    <td className="px-4 py-3 text-slate-600">{row.dates}</td>
                    <td className="px-4 py-3 text-slate-600">{row.days}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
