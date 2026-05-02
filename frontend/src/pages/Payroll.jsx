import React, { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Play, Check, Download, FileText, Plus } from "lucide-react";
import { Modal } from "../components/ui/Modal";

const MOCK_PAYRUNS = [
  { id: "PR-2026-05", month: "May 2026", employees: 12, totalAmount: ",500", status: "processed" },
  { id: "PR-2026-04", month: "April 2026", employees: 13, totalAmount: ",200", status: "paid" },
  { id: "PR-2026-06", month: "June 2026", employees: 12, totalAmount: "-", status: "draft" },
];

export default function Payroll() {
  const [payruns, setPayruns] = useState(MOCK_PAYRUNS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const processPayrun = (id) => {
    setIsProcessing(true);
    setTimeout(() => {
      setPayruns(payruns.map(p => p.id === id ? { ...p, status: "processed", totalAmount: ",100" } : p));
      setIsProcessing(false);
    }, 1500);
  };

  const columns = [
    { header: "Payrun ID", accessor: "id" },
    { header: "Month", accessor: "month" },
    { header: "Employees", accessor: "employees" },
    { header: "Total Amount", accessor: "totalAmount" },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={row.status === "paid" ? "approved" : row.status === "processed" ? "pending" : "draft"} /> },
    { header: "Actions", accessor: "actions", render: (row) => (
      <div className="flex gap-2">
        {row.status === "draft" && (
           <Button size="sm" onClick={() => processPayrun(row.id)} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700">
             {isProcessing ? "Processing..." : <><Play className="w-4 h-4 mr-1" /> Process</>}
           </Button>
        )}
        {row.status === "processed" && (
           <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
             <Check className="w-4 h-4 mr-1" /> Mark Paid
           </Button>
        )}
        {(row.status === "processed" || row.status === "paid") && (
          <Button size="sm" variant="secondary">
            <Download className="w-4 h-4 mr-1" /> Payslips
          </Button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payroll Management" 
        description="Process payruns, manage salary structures, and generate payslips."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Draft Payrun
          </Button>
        }
      />
      
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Payruns Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={payruns} />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Payrun">
        <div className="space-y-4 py-4">
           <p className="text-sm text-slate-600">Are you sure you want to initialize a draft payrun for the current period?</p>
           <div className="flex justify-end gap-2">
             <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button onClick={() => setIsModalOpen(false)}>Create</Button>
           </div>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 mb-4">Manage default PF, Professional Tax, and basic salary configurations.</div>
            <Button variant="secondary" className="w-full">
              <FileText className="w-4 h-4 mr-2" /> Edit Salary Configurations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
