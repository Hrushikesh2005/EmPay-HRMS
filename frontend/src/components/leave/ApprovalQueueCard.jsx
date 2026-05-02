import { useState } from "react";

function ApprovalQueueCard({ request, onApprove, onReject, isLoading, formatDate }) {
  const [fadeOut, setFadeOut] = useState(false);

  const handleApproveClick = async () => {
    setFadeOut(true);
    setTimeout(() => {
      onApprove();
    }, 300);
  };

  const handleRejectClick = async () => {
    setFadeOut(true);
    setTimeout(() => {
      onReject();
    }, 300);
  };

  return (
    <div
      className={`p-4 border border-gray-200 rounded-lg transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Header: Employee name (left) + Days (right) */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{request.employee_name}</h3>
        <span className="text-xs text-gray-500 font-medium">
          {request.total_days} days
        </span>
      </div>

      {/* Leave type + Date range */}
      <p className="text-sm text-gray-700 mb-2">
        {request.leave_type_name} • {formatDate(request.start_date)} -{" "}
        {formatDate(request.end_date)}
      </p>

      {/* Reason (italic, muted) */}
      {request.reason && (
        <p className="text-xs text-gray-500 italic mb-3">{request.reason}</p>
      )}

      {/* Approve + Reject buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApproveClick}
          disabled={isLoading}
          className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
        >
          {isLoading ? (
            <>
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
              <span>Approving...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Approve</span>
            </>
          )}
        </button>

        <button
          onClick={handleRejectClick}
          disabled={isLoading}
          className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
        >
          {isLoading ? (
            <>
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
              <span>Rejecting...</span>
            </>
          ) : (
            <>
              <span>✗</span>
              <span>Reject</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ApprovalQueueCard;
