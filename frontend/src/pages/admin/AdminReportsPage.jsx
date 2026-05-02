import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";

function AdminReportsPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [year, setYear] = useState(new Date().getFullYear());
  const [department, setDepartment] = useState("");

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axiosInstance.get(
        "/api/v1/admin/reports/leave/summary"
      );
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch report
  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const params = { year };
      if (department) params.department = department;

      const response = await axiosInstance.get(
        "/api/v1/admin/reports/leave",
        { params }
      );
      setReportRows(response.data || []);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStats();
    }
  }, [user]);

  // Fetch report when filters change
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchReport();
    }
  }, [user, year, department]);

  // Handle export CSV
  const handleExportCSV = async () => {
    try {
      const params = { year };
      if (department) params.department = department;

      const response = await axiosInstance.get(
        "/api/v1/admin/reports/leave/export",
        {
          params,
          responseType: "blob",
        }
      );

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `leave_report_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export report");
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="Leave Reports" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Employees */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Employees
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loadingStats ? "-" : stats?.total_employees || 0}
                </p>
              </div>
              <div className="text-4xl text-blue-100">👥</div>
            </div>
          </div>

          {/* On Leave Today */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  On Leave Today
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {loadingStats ? "-" : stats?.employees_on_leave_today || 0}
                </p>
              </div>
              <div className="text-4xl text-orange-100">📅</div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {loadingStats ? "-" : stats?.total_pending_requests || 0}
                </p>
              </div>
              <div className="text-4xl text-yellow-100">⏳</div>
            </div>
          </div>

          {/* Approved This Month */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Approved This Month
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {loadingStats ? "-" : stats?.total_approved_this_month || 0}
                </p>
              </div>
              <div className="text-4xl text-green-100">✅</div>
            </div>
          </div>
        </div>

        {/* Report Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Filter Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Filter by department..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingReport ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : reportRows.length > 0 ? (
                  reportRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {row.employee_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.department || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.leave_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">
                        {row.allocated_days}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">
                        {row.used_days}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">
                        {row.remaining_days}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {row.pending_days > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            {row.pending_days}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReportsPage;
