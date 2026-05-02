import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

function normalizeRole(role) {
  return typeof role === "string" ? role.toLowerCase() : "";
}

export default function ProtectedRoute({ allowedRoles, children, skipPasswordCheck = false }) {
  const auth = useAuth();
  const role = normalizeRole(auth?.role);

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change if required and not already on the page
  if (auth.mustChangePassword && !skipPasswordCheck) {
    return <Navigate to="/force-password-change" replace />;
  }

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.map(normalizeRole).includes(role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
