import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Directory from "./pages/Directory";
import AppShell from "./components/layout/AppShell";

// Temporary placeholder for dashboard content
function DashboardMock() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500">Welcome to your HRMS Portal. UI/UX layout is successfully wired.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardMock />} />
          <Route path="/directory" element={<Directory />} />
          {/* We will map /attendance, etc. here later */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

