import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
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

const ALL_ROLES = ["admin", "hr_officer", "payroll_officer", "employee"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route element={<AppShell />}>
          <Route element={<RoleBasedRoute allowedRoles={ALL_ROLES} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={["admin", "hr_officer", "payroll_officer", "employee"]} />}>
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<Leave />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={["admin", "payroll_officer"]} />}>
            <Route path="/payroll" element={<Payroll />} />
          </Route>
          
          <Route element={<RoleBasedRoute allowedRoles={["admin", "hr_officer", "payroll_officer"]} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
