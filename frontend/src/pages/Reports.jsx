import { useMemo } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Printer,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import useAuth from "../hooks/useAuth.js";

const REPORT_STATS = {
  totalEmployees: 45,
  activeEmployees: 42,
  inactiveEmployees: 3,
  totalLeaves: 156,
  approvedLeaves: 138,
  pendingLeaves: 12,
  rejectedLeaves: 6,
  averageAttendance: 94.5,
  totalDepartments: 5,
  maleEmployees: 28,
  femaleEmployees: 17,
};

export default function Reports() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const approvalRate = useMemo(
    () =>
      Math.round(
        (REPORT_STATS.approvedLeaves / REPORT_STATS.totalLeaves) * 100,
      ),
    [],
  );

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Access Denied"
          description="Reports are available only to administrators."
        />
        <Card>
          <CardContent className="p-8">
            <p className="text-slate-600">
              Only admins can access this section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("PDF export can be wired to jsPDF or html2pdf next.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Download and print company-wide statistics for attendance, leave, and workforce health."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:gap-2">
        <StatCard
          title="Total Employees"
          value={REPORT_STATS.totalEmployees}
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Active Employees"
          value={REPORT_STATS.activeEmployees}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Leave Requests"
          value={REPORT_STATS.totalLeaves}
          icon={FileText}
          color="warning"
        />
        <StatCard
          title="Average Attendance"
          value={`${REPORT_STATS.averageAttendance}%`}
          icon={BarChart3}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
        <Card className="print:shadow-none print:border-slate-300">
          <CardHeader className="border-b border-slate-100 print:border-slate-200">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Workforce Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Employees</span>
              <span className="font-bold text-lg text-slate-900">
                {REPORT_STATS.totalEmployees}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Active Employees</span>
              <span className="font-bold text-lg text-emerald-600">
                {REPORT_STATS.activeEmployees}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Inactive Employees</span>
              <span className="font-bold text-lg text-red-600">
                {REPORT_STATS.inactiveEmployees}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Male Employees</span>
                <span className="font-bold text-slate-900">
                  {REPORT_STATS.maleEmployees}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-600">Female Employees</span>
                <span className="font-bold text-slate-900">
                  {REPORT_STATS.femaleEmployees}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Departments</span>
                <span className="font-bold text-slate-900">
                  {REPORT_STATS.totalDepartments}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-slate-300">
          <CardHeader className="border-b border-slate-100 print:border-slate-200">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Leave Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Leave Requests</span>
              <span className="font-bold text-lg text-slate-900">
                {REPORT_STATS.totalLeaves}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Approved Leaves</span>
              <span className="font-bold text-lg text-emerald-600">
                {REPORT_STATS.approvedLeaves}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pending Leaves</span>
              <span className="font-bold text-lg text-amber-600">
                {REPORT_STATS.pendingLeaves}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Rejected Leaves</span>
              <span className="font-bold text-lg text-red-600">
                {REPORT_STATS.rejectedLeaves}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <p className="text-sm text-slate-500">
                Approval Rate:{" "}
                <span className="font-bold text-slate-900">
                  {approvalRate}%
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="print:shadow-none print:border-slate-300">
        <CardHeader className="border-b border-slate-100 print:border-slate-200">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Attendance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">
                Average Attendance
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {REPORT_STATS.averageAttendance}%
              </div>
              <div className="text-xs text-slate-500 mt-2">Current Month</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">
                On-Time Arrivals
              </div>
              <div className="text-3xl font-bold text-blue-600">89%</div>
              <div className="text-xs text-slate-500 mt-2">Last 30 Days</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">
                Perfect Attendance
              </div>
              <div className="text-3xl font-bold text-purple-600">12 Emp</div>
              <div className="text-xs text-slate-500 mt-2">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-2">
            Printable Company Report
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            This admin report aggregates overall statistics across the company
            and is intended for printing or PDF export.
          </p>
          <p className="text-xs text-slate-500">
            Last updated: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
