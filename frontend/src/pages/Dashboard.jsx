import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500">Welcome back{user ? `, ${user.full_name}` : ""}.</p>
      {user && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900">Your profile</div>
          <div className="mt-2 space-y-1">
            <div><span className="text-slate-500">Email:</span> {user.email}</div>
            <div><span className="text-slate-500">Role:</span> {user.role}</div>
          </div>
        </div>
      )}
    </div>
  );
}
