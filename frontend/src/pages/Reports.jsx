import React from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FileText, Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports" 
        description="Generate attendance, leave, and payroll reports."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" /> Attendance Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Monthly attendance summary, including LOP and overtime.</p>
            <Button variant="secondary" className="w-full"><Download className="w-4 h-4 mr-2" /> Download CSV</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Leave Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Employee leave balances, taken vs approved leaves.</p>
            <Button variant="secondary" className="w-full"><Download className="w-4 h-4 mr-2" /> Download CSV</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Payroll Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Aggregated payroll generation data, tax deductions, PF.</p>
            <Button variant="secondary" className="w-full"><Download className="w-4 h-4 mr-2" /> Download CSV</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
