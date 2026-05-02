import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleBasedRoute from "./routes/RoleBasedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Directory from "./pages/Directory.jsx";
import Profile from "./pages/Profile.jsx";
import Attendance from "./pages/Attendance.jsx";
import Leave from "./pages/Leave.jsx";
import Payroll from "./pages/Payroll.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import ForcePasswordChange from "./pages/ForcePasswordChange.jsx";
import useAuth from "./hooks/useAuth.js";

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function LoginRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
}

const ALL_ROLES = ["admin", "hr_officer", "payroll_officer", "employee"];
const HR_ROLES = ["admin", "hr_officer", "employee"];
const PAYROLL_ROLES = ["admin", "payroll_officer"];
const ADMIN_HR_PAYROLL = ["admin", "hr_officer", "payroll_officer"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route 
          path="/force-password-change" 
          element={
            <ProtectedRoute skipPasswordCheck>
              <ForcePasswordChange />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Universal Access */}
          <Route element={<RoleBasedRoute allowedRoles={ALL_ROLES} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Only */}
          <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Employee & HR (Attendance/Leave) */}
          <Route element={<RoleBasedRoute allowedRoles={ALL_ROLES} />}>
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<Leave />} />
          </Route>

          {/* Payroll Specialist Roles */}
          <Route element={<RoleBasedRoute allowedRoles={PAYROLL_ROLES} />}>
            <Route path="/payroll" element={<Payroll />} />
          </Route>
          
          {/* Internal Staff Roles (Reports) */}
          <Route element={<RoleBasedRoute allowedRoles={ADMIN_HR_PAYROLL} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
