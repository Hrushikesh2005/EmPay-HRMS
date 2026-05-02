import { useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";

const WARNING_ITEMS = [
  "1 employee without Bank A/c",
  "1 employee without Manager",
];

const RECENT_PAYRUNS = [
  { id: "PR-2025-10", label: "Payrun for Oct 2025 (3 Payslip)" },
  { id: "PR-2025-09", label: "Payrun for Sep 2025 (3 Payslip)" },
];

const EMPLOYER_COST = [
  { month: "Jan 2025", value: 780000 },
  { month: "Feb 2025", value: 820000 },
  { month: "Mar 2025", value: 860000 },
];

const EMPLOYEE_COUNT = [
  { month: "Jan 2025", value: 38 },
  { month: "Feb 2025", value: 42 },
  { month: "Mar 2025", value: 45 },
];

const PAYRUN_TABLE = [
  {
    id: "Oct 2025",
    employee: "[Employee]",
    employerCost: 50000,
    basicWage: 25000,
    grossWage: 50000,
    netWage: 43800,
    status: "done",
  },
];

const WORKED_DAYS = [
  { type: "Attendance", days: "20.00 (5 working days in week)", amount: 45833 },
  { type: "Paid Time off", days: "2.00 (2 paid leaves/month)", amount: 4167 },
];

const SALARY_COMPUTATION = {
  earnings: [
    { label: "Basic Salary", rate: "100%", amount: 25000 },
    { label: "House Rent Allowance", rate: "100%", amount: 12500 },
    { label: "Standard Allowance", rate: "100%", amount: 4167 },
    { label: "Performance Bonus", rate: "100%", amount: 2083 },
    { label: "Leave Travel Allowance", rate: "100%", amount: 2083 },
  ],
  deductions: [
    { label: "PF Employee", rate: "100%", amount: 3000 },
    { label: "PF Employer", rate: "100%", amount: 3000 },
    { label: "Professional Tax", rate: "100%", amount: 200 },
  ],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timelineView, setTimelineView] = useState("monthly");
  const [detailTab, setDetailTab] = useState("worked-days");

  const grossTotal = useMemo(
    () =>
      SALARY_COMPUTATION.earnings.reduce((sum, item) => sum + item.amount, 0),
    [],
  );
  const deductionTotal = useMemo(
    () =>
      SALARY_COMPUTATION.deductions.reduce((sum, item) => sum + item.amount, 0),
    [],
  );
  const netTotal = grossTotal - deductionTotal;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Process payruns, manage salary structures, and generate payslips."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setActiveTab("dashboard")}
              className={activeTab === "dashboard" ? "bg-primary-50 text-primary-700" : ""}
            >
              Dashboard
            </Button>
            <Button variant="secondary" onClick={() => setActiveTab("payrun")}
              className={activeTab === "payrun" ? "bg-primary-50 text-primary-700" : ""}
            >
              Payrun
            </Button>
          </div>
        }
      />

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Warning</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm text-slate-600">
                {WARNING_ITEMS.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Payrun</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm text-slate-600">
                {RECENT_PAYRUNS.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <Button variant="secondary" size="sm">Open</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                <CardTitle>Employer Cost</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={timelineView === "annual" ? "secondary" : "ghost"}
                    onClick={() => setTimelineView("annual")}
                  >
                    Annually
                  </Button>
                  <Button
                    size="sm"
                    variant={timelineView === "monthly" ? "secondary" : "ghost"}
                    onClick={() => setTimelineView("monthly")}
                  >
                    Monthly
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EMPLOYER_COST}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                <CardTitle>Employee Count</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={timelineView === "annual" ? "secondary" : "ghost"}
                    onClick={() => setTimelineView("annual")}
                  >
                    Annually
                  </Button>
                  <Button
                    size="sm"
                    variant={timelineView === "monthly" ? "secondary" : "ghost"}
                    onClick={() => setTimelineView("monthly")}
                  >
                    Monthly
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EMPLOYEE_COUNT}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "payrun" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Payrun</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> New Payslip
                </Button>
                <Button size="sm" variant="secondary">
                  Compute
                </Button>
                <Button size="sm" variant="secondary">
                  Validate
                </Button>
                <Button size="sm" variant="secondary">
                  Cancel
                </Button>
                <Button size="sm" variant="secondary" className="gap-2">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Pay Period</th>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Employer Cost</th>
                      <th className="px-6 py-3">Basic Wage</th>
                      <th className="px-6 py-3">Gross Wage</th>
                      <th className="px-6 py-3">Net Wage</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {PAYRUN_TABLE.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{row.id}</td>
                        <td className="px-6 py-4">{row.employee}</td>
                        <td className="px-6 py-4">{formatCurrency(row.employerCost)}</td>
                        <td className="px-6 py-4">{formatCurrency(row.basicWage)}</td>
                        <td className="px-6 py-4">{formatCurrency(row.grossWage)}</td>
                        <td className="px-6 py-4">{formatCurrency(row.netWage)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status === "done" ? "approved" : "pending"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Payslip Details</CardTitle>
              <div className="flex flex-wrap gap-2">
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
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Payrun</div>
                  <div className="font-semibold text-slate-900">Payrun Oct 2025</div>
                </div>
                <div>
                  <div className="text-slate-500">Salary Structure</div>
                  <div className="font-semibold text-slate-900">Regular Pay</div>
                </div>
                <div>
                  <div className="text-slate-500">Period</div>
                  <div className="font-semibold text-slate-900">01 Oct to 31 Oct</div>
                </div>
              </div>

              {detailTab === "worked-days" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase">
                    <span>Type</span>
                    <span className="text-right">Days</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {WORKED_DAYS.map((row) => (
                    <div key={row.type} className="grid grid-cols-3 text-sm">
                      <span>{row.type}</span>
                      <span className="text-right">{row.days}</span>
                      <span className="text-right">{formatCurrency(row.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-3 text-sm font-semibold">
                    <span>Total</span>
                    <span className="text-right">22.00</span>
                    <span className="text-right">{formatCurrency(50000)}</span>
                  </div>
                </div>
              )}

              {detailTab === "salary" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase">
                    <span>Rule Name</span>
                    <span className="text-right">Rate %</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="space-y-2">
                    {SALARY_COMPUTATION.earnings.map((item) => (
                      <div key={item.label} className="grid grid-cols-3 text-sm">
                        <span>{item.label}</span>
                        <span className="text-right">{item.rate}</span>
                        <span className="text-right">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-3 text-sm font-semibold">
                    <span>Gross</span>
                    <span className="text-right">100</span>
                    <span className="text-right">{formatCurrency(grossTotal)}</span>
                  </div>

                  <div className="space-y-2">
                    {SALARY_COMPUTATION.deductions.map((item) => (
                      <div key={item.label} className="grid grid-cols-3 text-sm">
                        <span>{item.label}</span>
                        <span className="text-right">{item.rate}</span>
                        <span className="text-right">-{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-3 text-sm font-semibold">
                    <span>Deductions</span>
                    <span className="text-right">100</span>
                    <span className="text-right">-{formatCurrency(deductionTotal)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-3 text-sm font-semibold">
                    <span>Net Amount</span>
                    <span className="text-right">100</span>
                    <span className="text-right">{formatCurrency(netTotal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-slate-300">
            <CardHeader className="border-b border-slate-100 print:border-slate-200">
              <CardTitle>Print Payslip</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">[Company Logo]</div>
                  <div className="text-lg font-semibold text-slate-900">Salary Slip for Feb 2025</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  Pay date: 23/2/2025
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div>Employee name : [Emp Name]</div>
                  <div>Employee code : [Emp Code]</div>
                  <div>Department : [Department]</div>
                  <div>Location : [Location]</div>
                  <div>Date of joining : 26/06/2017</div>
                </div>
                <div className="space-y-1">
                  <div>PAN : Dxxxxxxxx3</div>
                  <div>UAN : 123492343232</div>
                  <div>Bank A/c No. : 234923423432</div>
                  <div>Pay period : 1/1/2025 to 31/1/2025</div>
                  <div>Pay date : 23/2/2025</div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-sm font-semibold">Worked Days</div>
                <div className="px-4 py-3 text-sm flex justify-between">
                  <span>Attendance</span>
                  <span>20 Days</span>
                </div>
                <div className="px-4 pb-3 text-sm flex justify-between">
                  <span>Total</span>
                  <span>22 Days</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-xl p-4">
                <div>
                  <div className="text-sm font-semibold mb-2">Earnings</div>
                  {SALARY_COMPUTATION.earnings.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Deductions</div>
                  {SALARY_COMPUTATION.deductions.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>-{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-100 px-4 py-3 rounded-xl">
                <span className="text-sm font-semibold">Total Net Payable</span>
                <span className="text-sm font-semibold">{formatCurrency(netTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
