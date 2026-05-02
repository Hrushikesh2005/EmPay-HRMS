import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchEmployees } from "../services/employees";

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadEmployees = async () => {
      try {
        const data = await fetchEmployees();
        if (isMounted) {
          setEmployees(data || []);
        }
      } catch (err) {
        if (isMounted) {
          const detail = err?.response?.data?.detail;
          setError(detail || "Unable to load employees.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  // Simple client-side search logic
  const filteredEmployees = useMemo(() => {
    const normalized = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const name = emp.user?.full_name || "";
      const email = emp.user?.email || "";
      const department = emp.department || "";
      const designation = emp.designation || "";

      return (
        name.toLowerCase().includes(normalized) ||
        email.toLowerCase().includes(normalized) ||
        department.toLowerCase().includes(normalized) ||
        designation.toLowerCase().includes(normalized)
      );
    });
  }, [employees, searchTerm]);

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
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <Button variant="secondary" className="gap-2 shrink-0">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4 hidden md:table-cell">Department</th>
              <th className="px-6 py-4 hidden lg:table-cell">Designation</th>
              <th className="px-6 py-4">Employment</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  Loading employees...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{emp.user?.full_name || "-"}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{emp.user?.email || "-"}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-600">{emp.department || "-"}</td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-600">{emp.designation || "-"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.employment_type || "default"} />
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
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  No employees found matching "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
