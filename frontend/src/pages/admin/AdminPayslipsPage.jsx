import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";
import PayslipDetailModal from "../../components/payroll/PayslipDetailModal";

function AdminPayslipsPage() {
  const navigate = useNavigate();
  const { payrunId } = useParams();
  const { user } = useAuth();

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch payrun and payslips
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch payrun details
      const payrunResponse = await axiosInstance.get(
        `/api/v1/admin/payroll/payruns/${payrunId}`
      );
      setPayrun(payrunResponse.data);

      // Fetch payslips
      const payslipsResponse = await axiosInstance.get(
        `/api/v1/admin/payroll/payruns/${payrunId}/payslips`
      );
      setPayslips(payslipsResponse.data || []);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      setError("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user, payrunId]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="Payslips" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/payroll")}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← Back to Payruns
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {loading ? (
            <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          ) : payrun ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {payrun.period_label}
              </h2>
              <p className="text-sm text-gray-600">
                {payslips.length} payslips generated
              </p>
            </div>
          ) : null}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Payslips Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
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
                        <td colSpan="6" className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : payslips.length > 0 ? (
                  payslips.map((payslip) => (
                    <tr
                      key={payslip.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payslip.employee_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatCurrency(payslip.gross_salary)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatCurrency(payslip.total_deductions)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(payslip.net_pay)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {payslip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedPayslip(payslip)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No payslips found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <PayslipDetailModal
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}

export default AdminPayslipsPage;
