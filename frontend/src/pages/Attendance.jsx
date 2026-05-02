import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, CheckCircle2, History } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";

// Mock Data
const ATTENDANCE_HISTORY = [
  { id: 1, date: '2026-05-02', checkIn: '09:02 AM', checkOut: '--:-- PM', hours: '-', status: 'present' },
  { id: 2, date: '2026-05-01', checkIn: '08:55 AM', checkOut: '05:30 PM', hours: '8h 35m', status: 'present' },
  { id: 3, date: '2026-04-30', checkIn: '09:15 AM', checkOut: '02:00 PM', hours: '4h 45m', status: 'half_day' },
  { id: 4, date: '2026-04-29', checkIn: '--:-- AM', checkOut: '--:-- PM', hours: '-', status: 'absent' },
  { id: 5, date: '2026-04-28', checkIn: '--:-- AM', checkOut: '--:-- PM', hours: '-', status: 'on_leave' },
];

export default function Attendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckInOut = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
    } else {
      setIsCheckedOut(true);
    }
  };

  const columns = [
    { header: "Date", accessor: "date", render: (row) => format(new Date(row.date), "dd MMM yyyy") },
    { header: "Check In", accessor: "checkIn" },
    { header: "Check Out", accessor: "checkOut" },
    { header: "Working Hours", accessor: "hours" },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Tracking" 
        description="Mark your daily attendance and view your monthly timesheet."
      />

      {/* Action Banner */}
      <Card className="bg-primary-50 border-primary-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Clock className="w-32 h-32 text-primary-900" />
        </div>
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-1">
              {format(currentTime, "EEEE, dd MMMM yyyy")}
            </p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              {format(currentTime, "hh:mm:ss a")}
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={isCheckedOut ? "checked_out" : isCheckedIn ? "present" : "pending"} />
              <span className="text-sm text-slate-500">
                {isCheckedOut ? "You have completed your shift." : isCheckedIn ? "You are currently checked in." : "Please mark your attendance."}
              </span>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-48 text-lg py-6"
              variant={isCheckedIn && !isCheckedOut ? "danger" : "primary"}
              disabled={isCheckedOut}
              onClick={handleCheckInOut}
            >
              {isCheckedOut ? (
                <><CheckCircle2 className="mr-2" /> Shift Ended</>
              ) : isCheckedIn ? (
                "Check Out"
              ) : (
                "Check In Now"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly grid/History */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-lg">Monthly Timeline</CardTitle>
          </div>
          <Button variant="secondary" size="sm">Export CSV</Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={ATTENDANCE_HISTORY} />
        </CardContent>
      </Card>
    </div>
  );
}