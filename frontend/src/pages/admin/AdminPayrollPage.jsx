import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import CreatePayrunModal from "../../components/payroll/CreatePayrunModal";

function AdminPayrollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [confirmProcess, setConfirmProcess] = useState(null);

  // Format date as DD MMM YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch payruns
  const fetchPayruns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/api/v1/admin/payroll/payruns");
      setPayruns(response.data || []);
    } catch (err) {
      console.error("Error fetching payruns:", err);
      setError("Failed to load payruns");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchPayruns();
    }
  }, [user]);

  // Handle process payrun
  const handleProcessPayrun = async (payrunId) => {
    setProcessing(payrunId);
    try {
      await axiosInstance.post(
        `/api/v1/admin/payroll/payruns/${payrunId}/process`
      );
      // Refresh payruns list
      await fetchPayruns();
      setConfirmProcess(null);
    } catch (err) {
      console.error("Error processing payrun:", err);
      alert("Failed to process payrun");
    } finally {
      setProcessing(null);
    }
  };

  // Handle create payrun
  const handlePayrunCreated = () => {
    setShowCreateModal(false);
    fetchPayruns();
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="Payroll Management" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header with New Payrun button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payruns</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              + New Payrun
            </button>
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
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Finalized At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : payruns.length > 0 ? (
                  payruns.map((payrun) => (
                    <tr key={payrun.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {payrun.period_label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(payrun.period_start)} -{" "}
                          {formatDate(payrun.period_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge
                          status={payrun.status}
                          statusMap={{
                            draft: { color: "gray", label: "Draft" },
                            processing: { color: "blue", label: "Processing" },
                            finalized: { color: "green", label: "Finalized" },
                            paid: { color: "purple", label: "Paid" },
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {payrun.created_by}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(payrun.finalized_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {payrun.status === "draft" && (
                            <button
                              onClick={() => setConfirmProcess(payrun.id)}
                              disabled={processing === payrun.id}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded text-xs font-medium transition-colors"
                            >
                              {processing === payrun.id ? (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                  Processing...
                                </span>
                              ) : (
                                "Process"
                              )}
                            </button>
                          )}
                          {(payrun.status === "finalized" ||
                            payrun.status === "paid") && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/payroll/payruns/${payrun.id}/payslips`
                                )
                              }
                              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                            >
                              View Payslips
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No payruns yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Payrun Modal */}
      {showCreateModal && (
        <CreatePayrunModal
          onClose={() => setShowCreateModal(false)}
          onPayrunCreated={handlePayrunCreated}
        />
      )}

      {/* Process Confirmation Dialog */}
      {confirmProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Process Payrun?
            </h3>
            <p className="text-gray-600 mb-6">
              This will generate payslips for all employees. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmProcess(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessPayrun(confirmProcess)}
                disabled={processing === confirmProcess}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                {processing === confirmProcess ? "Processing..." : "Process"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayrollPage;
