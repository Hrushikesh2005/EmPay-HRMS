import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import RoleBasedRoute from "./routes/RoleBasedRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
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

const ALL_ROLES = ["admin", "hr_officer", "payroll_officer", "employee"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/force-password-change"
          element={
            <ProtectedRoute skipPasswordCheck>
              <ForcePasswordChange />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes Wrapper */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Universal Access Modules */}
          <Route element={<RoleBasedRoute allowedRoles={ALL_ROLES} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/register"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route path="/directory" element={<Directory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<Leave />} />
          </Route>

          {/* Admin Specific Modules */}
          <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Specialized Modules */}
          <Route element={<RoleBasedRoute allowedRoles={PAYROLL_ROLES} />}>
            <Route path="/payroll" element={<Payroll />} />
          </Route>
          
          <Route element={<RoleBasedRoute allowedRoles={ADMIN_HR_PAYROLL} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
