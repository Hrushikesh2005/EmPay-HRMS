import React, { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { StatusBadge } from "../components/ui/StatusBadge";

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

  // Simple client-side search logic for the mock
  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all employee profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Note: In a real app, only HR/Admin would see this button */}
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
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
          <Button variant="secondary" className="w-full sm:w-auto gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 hidden sm:table-cell">Code</th>
                <th className="px-6 py-4 hidden md:table-cell">Department</th>
                <th className="px-6 py-4 hidden lg:table-cell">Designation</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{emp.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-slate-600">{emp.code}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600">{emp.department}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-600">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={emp.status === "active" ? "approved" : emp.status === "inactive" ? "rejected" : emp.status} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No employees found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
