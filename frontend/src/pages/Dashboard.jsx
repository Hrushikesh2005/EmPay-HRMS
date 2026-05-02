import React from "react";
import { Users, Clock, CalendarIcon, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";

// Mock Data
const ATTENDANCE_TREND = [
  { name: 'Mon', present: 12, absent: 1 },
  { name: 'Tue', present: 13, absent: 0 },
  { name: 'Wed', present: 11, absent: 2 },
  { name: 'Thu', present: 10, absent: 3 },
  { name: 'Fri', present: 13, absent: 0 },
];

const LEAVE_BALANCE = [
  { name: 'Paid Leave', value: 12, color: '#0ea5e9' }, // primary-500
  { name: 'Sick Leave', value: 5, color: '#10b981' },  // success
  { name: 'Unpaid Leave', value: 2, color: '#f59e0b' }, // warning
];

export default function Dashboard() {
  // Try changing this to 'employee' to see the different view
  const MOCK_ROLE = "hr_officer"; 
  const isHR = MOCK_ROLE === 'admin' || MOCK_ROLE === 'hr_officer';

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back! Here is your ${isHR ? 'company' : 'personal'} overview.`}
      />

      {/* Stat Cards - Role Based */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isHR ? (
          <>
            <StatCard title="Total Headcount" value="13" icon={Users} color="primary" />
            <StatCard title="Present Today" value="11" icon={Clock} color="success" />
            <StatCard title="Pending Leaves" value="4" icon={CalendarIcon} color="warning" />
            <StatCard title="Last Payrun" value="$42.5k" icon={CreditCard} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Attendance (This Month)" value="92%" icon={Clock} color="success" />
            <StatCard title="Remaining Paid Leaves" value="12" icon={CalendarIcon} color="primary" />
            <StatCard title="Pending Approvals" value="1" icon={CalendarIcon} color="warning" />
            <StatCard title="Last Payslip" value="$4,250" icon={CreditCard} color="purple" />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isHR ? "Company Attendance Trend (7 Days)" : "Your Attendance Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ATTENDANCE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}}
                  />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  {isHR && <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance Donut */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{isHR ? "Leave Types Used" : "Your Leave Balance"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={LEAVE_BALANCE}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {LEAVE_BALANCE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full mt-4 space-y-2">
              {LEAVE_BALANCE.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-semibold">{item.value} days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
