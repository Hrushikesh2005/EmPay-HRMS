import { useState } from "react";
import axiosInstance from "../../api/axios";

function CreatePayrunModal({ onClose, onPayrunCreated }) {
  const [formData, setFormData] = useState({
    period_label: "",
    period_start: "",
    period_end: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.period_label.trim()) {
      setError("Period label is required");
      return false;
    }
    if (!formData.period_start) {
      setError("Period start date is required");
      return false;
    }
    if (!formData.period_end) {
      setError("Period end date is required");
      return false;
    }
    if (formData.period_end <= formData.period_start) {
      setError("Period end must be after period start");
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/api/v1/admin/payroll/payruns", {
        period_label: formData.period_label,
        period_start: formData.period_start,
        period_end: formData.period_end,
      });

      // Call callback to refresh parent
      onPayrunCreated();
    } catch (err) {
      console.error("Error creating payrun:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to create payrun. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Payrun
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Period Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Label
            </label>
            <input
              type="text"
              name="period_label"
              value={formData.period_label}
              onChange={handleChange}
              placeholder="e.g. May 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Period Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Start
            </label>
            <input
              type="date"
              name="period_start"
              value={formData.period_start}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Period End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period End
            </label>
            <input
              type="date"
              name="period_end"
              value={formData.period_end}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
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
                  Creating...
                </>
              ) : (
                "Create Payrun"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePayrunModal;
