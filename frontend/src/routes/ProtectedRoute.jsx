import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

function normalizeRole(role) {
  return typeof role === "string" ? role.toLowerCase() : "";
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const auth = useAuth();
  const role = normalizeRole(auth?.role);

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
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
