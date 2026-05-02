import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        "/api/v1/admin/dashboard/stats"
      );
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch pending leave requests
  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get(
        "/api/v1/admin/leave/requests/pending"
      );
      setPendingRequests(response.data.slice(0, 5)); // Show first 5
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStats();
      fetchPendingRequests();
    }
  }, [user]);

  // Handle approve leave
  const handleApprove = async (requestId) => {
    setApprovingId(requestId);
    try {
      await axiosInstance.patch(
        `/api/v1/admin/leave/requests/${requestId}/approve`,
        { review_remarks: null }
      );

      // Remove from list and update pending count
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      if (stats) {
        setStats((prev) => ({
          ...prev,
          pending_leave_requests: Math.max(
            0,
            prev.pending_leave_requests - 1
          ),
        }));
      }
    } catch (err) {
      console.error("Error approving leave:", err);
      alert("Failed to approve leave request");
    } finally {
      setApprovingId(null);
    }
  };

  // Handle reject leave
  const handleReject = async (requestId) => {
    setRejectingId(requestId);
    try {
      await axiosInstance.patch(
        `/api/v1/admin/leave/requests/${requestId}/reject`,
        { review_remarks: null }
      );

      // Remove from list and update pending count
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      if (stats) {
        setStats((prev) => ({
          ...prev,
          pending_leave_requests: Math.max(
            0,
            prev.pending_leave_requests - 1
          ),
        }));
      }
    } catch (err) {
      console.error("Error rejecting leave:", err);
      alert("Failed to reject leave request");
    } finally {
      setRejectingId(null);
    }
  };

  // Skeleton loader for stat cards
  const StatCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </div>
  );

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          System overview and quick actions
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => {
                fetchStats();
                fetchPendingRequests();
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Employees */}
          {loadingStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Employees
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.total_employees || 0}
                  </p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
          )}

          {/* Present Today */}
          {loadingStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Present Today
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats?.present_today || 0}
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
          )}

          {/* Pending Leaves */}
          {loadingStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Pending Leaves
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {stats?.pending_leave_requests || 0}
                  </p>
                </div>
                <div className="text-4xl">🕐</div>
              </div>
            </div>
          )}

          {/* Last Payrun Status */}
          {loadingStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Last Payrun
                  </p>
                  {stats?.last_payrun_label ? (
                    <>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        {stats.last_payrun_label}
                      </p>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            stats.last_payrun_status === "finalized"
                              ? "bg-green-100 text-green-800"
                              : stats.last_payrun_status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {stats.last_payrun_status === "finalized"
                            ? "✓ Finalized"
                            : stats.last_payrun_status === "processing"
                            ? "⏳ Processing"
                            : "📋 Draft"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 mt-2">No payrun yet</p>
                  )}
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Two Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Recent Leave Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Leave Requests
            </h2>

            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {request.employee_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.leave_type_name} • {request.days} days
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.dates}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={
                          approvingId === request.id ||
                          rejectingId === request.id
                        }
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        {approvingId === request.id ? (
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          "✓"
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={
                          approvingId === request.id ||
                          rejectingId === request.id
                        }
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        {rejectingId === request.id ? (
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          "✕"
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No pending leave requests
              </p>
            )}
          </div>

          {/* Right Panel: Payroll Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payroll Summary
            </h2>

            {loadingStats ? (
              <>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                {/* Last Payrun Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Last Payrun</p>
                  {stats?.last_payrun_label ? (
                    <>
                      <p className="text-lg font-semibold text-gray-900">
                        {stats.last_payrun_label}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            stats.last_payrun_status === "finalized"
                              ? "bg-green-100 text-green-800"
                              : stats.last_payrun_status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {stats.last_payrun_status === "finalized"
                            ? "✓ Finalized"
                            : stats.last_payrun_status === "processing"
                            ? "⏳ Processing"
                            : "📋 Draft"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {stats.last_payrun_date
                            ? formatDate(stats.last_payrun_date)
                            : ""}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No payrun created yet</p>
                  )}
                </div>

                {/* Go to Payroll Button */}
                <button
                  onClick={() => navigate("/admin/payroll")}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Payroll →
                </button>

                {/* Warning: Employees without salary structure */}
                {stats?.employees_without_salary_structure > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium">
                      ⚠ {stats.employees_without_salary_structure}{" "}
                      {stats.employees_without_salary_structure === 1
                        ? "employee"
                        : "employees"}{" "}
                      without salary structure
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      Cannot process payroll for these employees.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 3: Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Manage Employees */}
          <button
            onClick={() => navigate("/directory")}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">👥</div>
              <span className="text-gray-400 group-hover:text-gray-600">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Manage Employees
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              View and manage employee records
            </p>
          </button>

          {/* Time Off */}
          <button
            onClick={() => navigate("/admin/leave")}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">🕐</div>
              <span className="text-gray-400 group-hover:text-gray-600">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Time Off
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Approve and manage leave requests
            </p>
          </button>

          {/* Payroll */}
          <button
            onClick={() => navigate("/admin/payroll")}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">💰</div>
              <span className="text-gray-400 group-hover:text-gray-600">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Payroll
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage payruns
            </p>
          </button>

          {/* Reports */}
          <button
            onClick={() => navigate("/admin/reports")}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">📊</div>
              <span className="text-gray-400 group-hover:text-gray-600">→</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Reports
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              View leave reports and analytics
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
