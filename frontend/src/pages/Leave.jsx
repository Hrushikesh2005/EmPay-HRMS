import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar, Check, X, FileText, BarChart3 } from "lucide-react";
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
import useAuth from "../hooks/useAuth.js";

// Mock Data
const MY_LEAVES = [
  {
    id: 1,
    type: "Paid Leave",
    from: "2026-05-15",
    to: "2026-05-16",
    days: 2,
    status: "approved",
  },
  {
    id: 2,
    type: "Sick Leave",
    from: "2026-04-20",
    to: "2026-04-20",
    days: 1,
    status: "rejected",
  },
  {
    id: 3,
    type: "Paid Leave",
    from: "2026-06-01",
    to: "2026-06-05",
    days: 5,
    status: "pending",
  },
];

const COMPANY_LEAVE_HISTORY = [
  {
    id: 101,
    employee: "Dev Nair",
    type: "Sick Leave",
    from: "2026-05-12",
    to: "2026-05-13",
    days: 2,
    status: "approved",
  },
  {
    id: 102,
    employee: "Priya Kapoor",
    type: "Paid Leave",
    from: "2026-05-20",
    to: "2026-05-25",
    days: 6,
    status: "approved",
  },
  {
    id: 103,
    employee: "Rajesh Kumar",
    type: "Paid Leave",
    from: "2026-06-01",
    to: "2026-06-05",
    days: 5,
    status: "pending",
  },
  {
    id: 104,
    employee: "Sneha Patel",
    type: "Unpaid Leave",
    from: "2026-05-10",
    to: "2026-05-10",
    days: 1,
    status: "approved",
  },
];

export default function Leave() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const isHR = role === "admin" || role === "hr_officer";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmitLeave = (data) => {
    console.log("Submitting Leave Request: ", data);
    // API logic will go here
    setIsModalOpen(false);
    reset();
  };

  const myLeavesColumns = [
    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.type}</span>
      ),
    },
    {
      header: "From Date",
      accessor: "from",
      render: (row) => format(new Date(row.from), "dd MMM yyyy"),
    },
    {
      header: "To Date",
      accessor: "to",
      render: (row) => format(new Date(row.to), "dd MMM yyyy"),
    },
    { header: "Days", accessor: "days" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const companyLeavesColumns = [
    { header: "Employee", accessor: "employee" },
    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.type}</span>
      ),
    },
    {
      header: "From Date",
      accessor: "from",
      render: (row) => format(new Date(row.from), "dd MMM yyyy"),
    },
    {
      header: "To Date",
      accessor: "to",
      render: (row) => format(new Date(row.to), "dd MMM yyyy"),
    },
    { header: "Days", accessor: "days" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Leave Management"
          description="View company-wide leave statistics and leave history."
        />

        {/* Company-wide Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leave Requests"
            value="45"
            icon={Calendar}
            color="primary"
          />
          <StatCard
            title="Approved Leaves"
            value="38"
            icon={Check}
            color="success"
          />
          <StatCard
            title="Pending Approvals"
            value="5"
            icon={Calendar}
            color="warning"
          />
          <StatCard title="Rejected Leaves" value="2" icon={X} color="danger" />
        </div>

        {/* Leave History */}
        <Card>
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              <CardTitle className="text-lg">Recent Leave History</CardTitle>
            </div>
            <Button variant="secondary" size="sm">
              Export Report
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={companyLeavesColumns}
              data={COMPANY_LEAVE_HISTORY}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // HR Officer view (can approve/reject)
  if (isHR) {
    const PENDING_APPROVALS = [
      {
        id: 101,
        employee: "Dev Nair",
        type: "Sick Leave",
        dates: "12 May - 13 May",
        days: 2,
        reason: "Viral fever",
      },
      {
        id: 102,
        employee: "Priya Kapoor",
        type: "Paid Leave",
        dates: "20 May - 25 May",
        days: 6,
        reason: "Family vacation",
      },
    ];

    return (
      <div className="space-y-6">
        <PageHeader
          title="Leave Management"
          description="Manage leave requests and view team leave history."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Leaves Record */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">My Leave History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={myLeavesColumns} data={MY_LEAVES} />
            </CardContent>
          </Card>

          {/* HR Approvals Queue */}
          <Card className="lg:col-span-1 border-warning/50 bg-amber-50/10">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Team Approvals Queue</span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                  2 Pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {PENDING_APPROVALS.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border text-sm border-slate-200 p-4 rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900">
                      {req.employee}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {req.days} days
                    </span>
                  </div>
                  <div className="text-slate-600 mb-1">
                    <span className="font-medium text-slate-800 tracking-tight">
                      {req.type}
                    </span>{" "}
                    • {req.dates}
                  </div>
                  <div className="text-slate-500 italic mb-4">
                    "{req.reason}"
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-danger hover:text-danger hover:bg-red-50 hover:border-red-200"
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Employee view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Apply for time off and track your leave balances."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>Apply for Leave</Button>
        }
      />

      {/* Leave Application Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Leave Request"
      >
        <form onSubmit={handleSubmit(onSubmitLeave)} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Leave Type
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register("leave_type", { required: true })}
            >
              <option value="">Select leave type...</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
            {errors.leave_type && (
              <span className="text-xs text-danger">Required field</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="From Date"
              {...register("from_date", { required: true })}
              error={errors.from_date && "Required field"}
            />
            <Input
              type="date"
              label="To Date"
              {...register("to_date", { required: true })}
              error={errors.to_date && "Required field"}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Reason
            </label>
            <textarea
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-25"
              placeholder="Please provide a brief reason for your leave..."
              {...register("reason", { required: true })}
            />
            {errors.reason && (
              <span className="text-xs text-danger">Required field</span>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Paid Leave Remaining"
          value="12"
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Sick Leave Remaining"
          value="5"
          icon={Calendar}
          color="success"
        />
        <StatCard
          title="Unpaid Leaves Taken"
          value="2"
          icon={FileText}
          color="warning"
        />
      </div>

      {/* My Leaves Record */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">My Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={myLeavesColumns} data={MY_LEAVES} />
        </CardContent>
      </Card>
    </div>
  );
}
