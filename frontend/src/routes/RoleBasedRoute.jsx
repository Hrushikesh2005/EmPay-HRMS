import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const RoleBasedRoute = ({ module, action = "view", allowedRoles }) => {
  const { role, permissions, isAuthenticated, permissionsLoading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // While permissions are still being fetched from the API, show a spinner
  // instead of flashing /unauthorized (the root cause of the access denied flash)
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Admin always has access
  if (role === "admin") return <Outlet />;

  // Legacy role check
  if (allowedRoles && allowedRoles.includes(role)) return <Outlet />;

  // Module permission check
  if (module) {
    const perm = permissions.find((p) => p.module === module);
    if (!perm || perm.access_level === "none") {
      return <Navigate to="/unauthorized" replace />;
    }

    // Check for edit rights if required
    if (action === "edit" && !perm.can_edit) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default RoleBasedRoute;
