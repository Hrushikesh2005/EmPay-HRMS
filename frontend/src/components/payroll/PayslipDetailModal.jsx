function PayslipDetailModal({ payslip, onClose }) {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b">
          <div>
            <h2 className="text-xl font-bold text-white">
              {payslip.employee_name}
            </h2>
            <p className="text-blue-100 text-sm">Period: {payslip.payrun_id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Earnings Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Earnings
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      Basic Salary
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(payslip.basic_salary)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      HRA
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(payslip.hra)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      Other Allowances
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(payslip.other_allowances)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-900 font-bold">
                      Gross Salary
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-bold text-lg">
                      {formatCurrency(payslip.gross_salary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deductions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deductions
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      PF (Employee)
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(payslip.pf_employee)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      Professional Tax
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(payslip.professional_tax)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      LOP Deduction
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(0)} {/* Calculated as part of deductions */}
                    </td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-4 py-3 text-gray-900 font-bold">
                      Total Deductions
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-bold text-lg">
                      {formatCurrency(payslip.total_deductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Pay Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <p className="text-gray-600 font-medium mb-2">Net Pay</p>
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(payslip.net_pay)}
            </p>
          </div>

          {/* Attendance Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Working Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslip.working_days}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Present Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslip.present_days}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Leave Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslip.leave_days}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">LOP Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payslip.lop_days}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() =>
                window.open(`/api/v1/payslips/${payslip.id}/pdf`, "_blank")
              }
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayslipDetailModal;
