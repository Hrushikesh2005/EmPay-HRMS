import React from "react";
import useAuth from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Users, Clock, Calendar, CheckCircle, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_ATTENDANCE_DATA = [
  { name: 'Mon', present: 12, absent: 1 },
  { name: 'Tue', present: 13, absent: 0 },
  { name: 'Wed', present: 10, absent: 3 },
  { name: 'Thu', present: 13, absent: 0 },
  { name: 'Fri', present: 11, absent: 2 },
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  const role = user?.role || "employee";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back{user ? `, ${user.full_name}` : ""}.</p>
        </div>
      </div>

      {user && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 mb-6">
          <div className="font-medium text-slate-900">Your profile</div>
          <div className="mt-2 space-y-1">
            <div><span className="text-slate-500">Email:</span> {user.email}</div>
            <div><span className="text-slate-500">Role:</span> {user.role}</div>
          </div>
        </div>
      )}

      {(role === "hr_officer" || role === "admin") && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Headcount" value="13" icon={Users} color="primary" />
            <StatCard title="Present Today" value="12" icon={Clock} color="success" />
            <StatCard title="Pending Leaves" value="3" icon={Calendar} color="warning" />
            <StatCard title="Last Payrun" value="Processed" icon={CheckCircle} color="primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends (7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_ATTENDANCE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="present" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 sm:p-4 border rounded-xl">
                        <span className="font-medium">Engineering</span>
                        <span className="text-emerald-600 font-semibold">95% Present</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 border rounded-xl">
                        <span className="font-medium">Design</span>
                        <span className="text-emerald-600 font-semibold">100% Present</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 border rounded-xl">
                        <span className="font-medium">Product</span>
                        <span className="text-amber-600 font-semibold">80% Present</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {role === "payroll_officer" && (
        <>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Current Payrun Tasks" value="2 Pending" icon={CreditCard} color="warning" />
              <StatCard title="Leave Approvals Queue" value="4" icon={Calendar} color="warning" />
              <StatCard title="Processed this Month" value="$42,500" icon={CheckCircle} color="success" />
           </div>

           <Card>
             <CardHeader>
               <CardTitle>Payroll Pipeline</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-slate-500">See the <a href="/payroll" className="text-primary-600 font-medium">Payroll Management</a> tab for detailed payrun status and actions.</div>
             </CardContent>
           </Card>
        </>
      )}
    </div>
  );
}
