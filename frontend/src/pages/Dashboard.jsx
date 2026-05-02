// React import not required with automatic JSX runtime
import useAuth from "../hooks/useAuth.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Users, Clock, Calendar, CheckCircle, CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axios.js";
import useRealtime from "../hooks/useRealtime.js";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const MOCK_ATTENDANCE_DATA = [
  { name: "Mon", present: 12, absent: 1 },
  { name: "Tue", present: 13, absent: 0 },
  { name: "Wed", present: 10, absent: 3 },
  { name: "Thu", present: 13, absent: 0 },
  { name: "Fri", present: 11, absent: 2 },
];

export default function Dashboard() {
  const { user, role } = useAuth();
  const [balances, setBalances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchBalances = () => {
    api
      .get("/leave-balances/me")
      .then((r) => setBalances(r.data || []))
      .catch((e) => console.error(e));
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const r = await api.get("/stats/dashboard");
      setStats(r.data);
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!role) return;
    if (role === "employee") fetchBalances();
    else fetchStats();
  }, [role]);

  useRealtime((ev) => {
    if (!ev) return;
    if (ev.type === "leave_request") fetchBalances();
    if (ev.type === "attendance") fetchStats();
  });

  if (!user || !role) {
    return <div className="text-slate-500 p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back{user ? `, ${user.full_name}` : ""}.
          </p>
        </div>
      </div>

      {(role === "hr_officer" || role === "admin") && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Headcount"
              value={stats.total_headcount}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Present Today"
              value={stats.present_today}
              icon={Clock}
              color="success"
            />
            <StatCard
              title="Pending Leaves"
              value={stats.pending_leaves}
              icon={Calendar}
              color="warning"
            />
            <StatCard
              title="Today's Attendance"
              value={stats.total_headcount > 0 
                ? `${Math.round((stats.present_today / stats.total_headcount) * 100)}%`
                : "0%"
              }
              icon={CheckCircle}
              color="primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends (7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.attendance_trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="present"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="absent"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Headcount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.dept_stats?.map(([dept, count]) => (
                    <div key={dept || "Other"} className="flex justify-between items-center p-3 sm:p-4 border rounded-xl">
                      <span className="font-medium">{dept || "Unassigned"}</span>
                      <span className="text-primary-600 font-semibold">
                        {count} {count === 1 ? "Employee" : "Employees"}
                      </span>
                    </div>
                  ))}
                  {(!stats.dept_stats || stats.dept_stats.length === 0) && (
                    <div className="text-slate-400 text-sm py-4 text-center">No department data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {role === "payroll_officer" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Current Payrun Tasks"
              value={stats?.pending_leaves > 0 ? `${stats.pending_leaves} Actions` : "No Tasks"}
              icon={CreditCard}
              color="warning"
            />
            <StatCard
              title="Today's Attendance"
              value={stats?.total_headcount > 0 
                ? `${Math.round((stats.present_today / stats.total_headcount) * 100)}%`
                : "0%"
              }
              icon={CheckCircle}
              color="warning"
            />
            <StatCard
              title="Estimated Monthly Cost"
              value={stats?.employer_cost?.length > 0 
                ? `₹${(stats.employer_cost[stats.employer_cost.length - 1].value / 1000).toFixed(1)}k`
                : "₹0"
              }
              icon={CheckCircle}
              color="success"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-slate-500">
                See the{" "}
                <a href="/payroll" className="text-primary-600 font-medium">
                  Payroll Management
                </a>{" "}
                tab for detailed payrun status and actions.
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {role === "employee" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {balances.length === 0 && (
              <Card className="col-span-3">
                <CardContent className="p-8 text-center text-slate-400">
                  No leave balances found. Contact HR to set up your leave allocation.
                </CardContent>
              </Card>
            )}
            {balances.map((b) => (
              <Card key={b.id} className="border shadow-sm">
                <CardContent className="p-5 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {b.leave_type_name || b.leave_type?.name || "Leave"}
                  </p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold text-primary-600">{b.remaining_days ?? b.balance ?? 0}</span>
                    <span className="text-sm text-slate-400 mb-1">/ {b.total_days ?? b.allocated_days ?? 0} days</span>
                  </div>
                  <p className="text-xs text-slate-400">Available balance</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
