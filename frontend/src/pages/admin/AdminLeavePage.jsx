import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import ApprovalQueueCard from "../../components/leave/ApprovalQueueCard";

function AdminLeavePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // State for left panel (My Leave History)
  const [myLeaveHistory, setMyLeaveHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState(null);

  // State for right panel (Team Approvals Queue)
  const [teamQueue, setTeamQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [errorQueue, setErrorQueue] = useState(null);

  // State for pending count badge
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  // State for button actions
  const [actionInProgress, setActionInProgress] = useState(null);

  // Format date as DD MMM YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Fetch admin's own leave history
  const fetchMyLeaveHistory = async () => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const response = await axiosInstance.get("/api/v1/leave-requests/me");
      setMyLeaveHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      setErrorHistory("Failed to load leave history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch team pending requests
  const fetchTeamQueue = async () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    try {
      const response = await axiosInstance.get(
        "/api/v1/admin/leave/requests/pending"
      );
      setTeamQueue(response.data || []);
    } catch (error) {
      console.error("Error fetching team queue:", error);
      setErrorQueue("Failed to load approval queue");
    } finally {
      setLoadingQueue(false);
    }
  };

  // Fetch pending count
  const fetchPendingCount = async () => {
    setLoadingCount(true);
    try {
      const response = await axiosInstance.get(
        "/api/v1/admin/leave/requests/pending-count"
      );
      setPendingCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching pending count:", error);
    } finally {
      setLoadingCount(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchMyLeaveHistory();
      fetchTeamQueue();
      fetchPendingCount();
    }
  }, [user]);

  // Handle approve action
  const handleApprove = async (requestId) => {
    setActionInProgress(requestId);
    try {
      await axiosInstance.patch(
        `/api/v1/admin/leave/requests/${requestId}/approve`,
        { review_remarks: "" }
      );

      // Optimistic update: remove card from queue
      setTeamQueue((prev) => prev.filter((req) => req.id !== requestId));

      // Decrement pending count
      setPendingCount((prev) => Math.max(0, prev - 1));

      // Refresh history table
      await fetchMyLeaveHistory();
    } catch (error) {
      console.error("Error approving leave:", error);
      alert("Failed to approve leave request");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle reject action
  const handleReject = async (requestId) => {
    setActionInProgress(requestId);
    try {
      await axiosInstance.patch(
        `/api/v1/admin/leave/requests/${requestId}/reject`,
        { review_remarks: "" }
      );

      // Optimistic update: remove card from queue
      setTeamQueue((prev) => prev.filter((req) => req.id !== requestId));

      // Decrement pending count
      setPendingCount((prev) => Math.max(0, prev - 1));

      // Refresh history table
      await fetchMyLeaveHistory();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert("Failed to reject leave request");
    } finally {
      setActionInProgress(null);
    }
  };

  // Skeleton loader for table rows
  const SkeletonRow = () => (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
    </tr>
  );

  // Columns for leave history table
  const columns = [
    { key: "leave_type_name", label: "Type" },
    {
      key: "start_date",
      label: "From Date",
      render: (value) => formatDate(value),
    },
    {
      key: "end_date",
      label: "To Date",
      render: (value) => formatDate(value),
    },
    { key: "total_days", label: "Days" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge
          status={value}
          statusMap={{
            pending: { color: "yellow", label: "Pending" },
            approved: { color: "green", label: "Approved" },
            rejected: { color: "red", label: "Rejected" },
            cancelled: { color: "gray", label: "Cancelled" },
          }}
        />
      ),
    },
  ];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="Leave Management" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT PANEL — My Leave History (60%) */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                My Leave History
              </h2>

              {errorHistory && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                  {errorHistory}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory ? (
                      <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                      </>
                    ) : myLeaveHistory.length > 0 ? (
                      myLeaveHistory.map((leave) => (
                        <tr
                          key={leave.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          {columns.map((col) => (
                            <td key={col.key} className="px-6 py-4 text-sm">
                              {col.render
                                ? col.render(leave[col.key])
                                : leave[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No leave requests yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Team Approvals Queue (40%) */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Approvals Queue
                </h2>
                <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {loadingCount ? "..." : pendingCount}
                </span>
              </div>

              {errorQueue && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {errorQueue}
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadingQueue ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 border border-gray-200 rounded-lg animate-pulse"
                      >
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </>
                ) : teamQueue.length > 0 ? (
                  teamQueue.map((request) => (
                    <ApprovalQueueCard
                      key={request.id}
                      request={request}
                      onApprove={() => handleApprove(request.id)}
                      onReject={() => handleReject(request.id)}
                      isLoading={actionInProgress === request.id}
                      formatDate={formatDate}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLeavePage;
