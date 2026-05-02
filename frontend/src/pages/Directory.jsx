import React, { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, LayoutGrid, List, Mail, Building2, Briefcase } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { StatusBadge } from "../components/ui/StatusBadge";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/PageHeader";

// Mock data reflecting the backend seed.py structure
const MOCK_EMPLOYEES = [
  { id: "1", code: "EMP-0001", name: "Aarav Mehta", email: "emp01@empay.io", department: "Engineering", designation: "Tech Lead", status: "active" },
  { id: "2", code: "EMP-0002", name: "Siya Sharma", email: "emp02@empay.io", department: "Product", designation: "Product Manager", status: "active" },
  { id: "3", code: "EMP-0003", name: "Rohan Joshi", email: "emp03@empay.io", department: "Design", designation: "UI Designer", status: "on_leave" },
  { id: "4", code: "EMP-0004", name: "Priya Kapoor", email: "emp04@empay.io", department: "Finance", designation: "Senior Analyst", status: "active" },
  { id: "5", code: "EMP-0005", name: "Dev Nair", email: "emp05@empay.io", department: "Engineering", designation: "SDE II", status: "inactive" },
];

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'table' or 'grid'

  // Simple client-side search logic for the mock
  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
  emp.department.topLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: "Employee", 
      accessor: "name", 
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-slate-500 text-xs mt-0.5">{row.email}</div>
        </div>
      ) 
    },
    { header: "Code", accessor: "code", cellClassName: "hidden sm:table-cell", headerClassName: "hidden sm:table-cell" },
    { header: "Department", accessor: "department", cellClassName: "hidden md:table-cell", headerClassName: "hidden md:table-cell" },
    { header: "Designation", accessor: "designation", cellClassName: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell" },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={row.status === "active" ? "approved" : row.status === "inactive" ? "rejected" : row.status} /> },
    { 
      header: "", 
      accessor: "actions", 
      cellClassName: "text-right",
      render: () => (
        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employee Directory" 
        description="Manage and view all employee profiles."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        }
      />

      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-between sm:flex-row gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, code, or department..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
-        
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="secondary" className="gap-2 shrink-0">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <Card className="overflow-hidden">
          <DataTable 
            columns={columns} 
            data=+{filteredEmployees} 
            emptyMessage={`No employees found matching "${searchTerm}".`} 
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => (
              <Card key={emp.id} className="flex flex-col hover:border-primary-200 transition-colors group">
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      {emp.name.split(' ').map(n > n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg leading-tight">{emp.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{emp.designation}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-primary-600 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <StatusBadge status={emp.status === "active" ? "approved" : emp.status === "inactive" ? "rejected" : emp.status} />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 mr-3 text-slate-400" />
                      {emp.code}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Building2 className="w-4 h-4 mr-3 text-slate-400" />
                      {emp.department}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-3 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 mt-auto">
                  <Button variant="ghost" className="w-full text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-medium">
                    View Profile
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-xl">
              <Search className="w-8 h-8 text-slate-300 mb-3" />
              <p lassName="text-slate-500">No employees found matching "${searchTerm}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
