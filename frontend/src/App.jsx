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
import PayrollWizard from "./pages/PayrollWizard.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import ForcePasswordChange from "./pages/ForcePasswordChange.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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

        {/* Main Application Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route element={<RoleBasedRoute module="dashboard" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Directory & Onboarding */}
          <Route element={<RoleBasedRoute module="directory" />}>
            <Route path="/directory" element={<Directory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<RoleBasedRoute module="directory" action="edit" />}>
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Attendance */}
          <Route element={<RoleBasedRoute module="attendance" />}>
            <Route path="/attendance" element={<Attendance />} />
          </Route>

          {/* Leave */}
          <Route element={<RoleBasedRoute module="leave" />}>
            <Route path="/leave" element={<Leave />} />
          </Route>

          {/* Payroll */}
          <Route
            element={
              <RoleBasedRoute
                module="payroll"
                allowedRoles={["admin", "payroll_officer"]}
              />
            }
          >
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/payroll-wizard" element={<PayrollWizard />} />
          </Route>

          {/* Reports */}
          <Route element={<RoleBasedRoute module="reports" />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Settings */}
          <Route element={<RoleBasedRoute module="settings" />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
