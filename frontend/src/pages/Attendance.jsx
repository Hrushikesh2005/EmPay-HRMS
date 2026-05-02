import { useEffect, useState } from "react";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Clock, CheckCircle2, History, Loader2, Calendar, Users } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import useAuth from "../hooks/useAuth.js";
import api from "../api/axios.js";
import useRealtime from "../hooks/useRealtime.js";
import { checkIn, checkOut, getMyAttendanceHistory, getMyLeaveBalances } from "../services/attendance";

const EMPLOYEE_ATTENDANCE = [
  { id: 1, name: "Dev Nair", status: "present", checkIn: "09:02 AM", checkOut: "--:-- PM", hours: "--", todayStatus: "Checked In" },
  { id: 2, name: "Priya Kapoor", status: "present", checkIn: "09:15 AM", checkOut: "05:30 PM", hours: "8h 15m", todayStatus: "Checked Out" },
  { id: 3, name: "Rajesh Kumar", status: "absent", checkIn: "--", checkOut: "--", hours: "--", todayStatus: "Absent" },
  { id: 4, name: "Sneha Patel", status: "on_leave", checkIn: "--", checkOut: "--", hours: "--", todayStatus: "On Leave" },
];

export default function Attendance() {
  const { role } = useAuth();
  const isAdminOrHr = role === 'admin' || role === 'hr_officer';
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyData, balancesData] = await Promise.all([
        getMyAttendanceHistory(),
        getMyLeaveBalances()
      ]);
      setHistory(historyData);
      setLeaveBalances(balancesData);

      // Check today's status
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayEntry = historyData.find(entry => entry.work_date === todayStr);
      
      if (todayEntry) {
        setIsCheckedIn(!!todayEntry.check_in);
        setIsCheckedOut(!!todayEntry.check_out);
      } else {
        setIsCheckedIn(false);
        setIsCheckedOut(false);
      }
    } catch (error) {
      console.error("Failed to load attendance data", error);
    } finally {
      setLoading(false);
    }
  };

  // initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // subscribe to realtime updates for attendance
  useRealtime((event) => {
    if (!event) return;
    if (event.type === "attendance") {
      // refresh attendance when attendance events arrive
      fetchData();
    }
  });

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await checkIn();
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Check-in failed", error);
      alert(error.response?.data?.detail || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await checkOut();
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Check-out failed", error);
      alert(error.response?.data?.detail || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    try {
      const mins = differenceInMinutes(parseISO(checkOut), parseISO(checkIn));
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    } catch (e) {
      return '-';
    }
  };

  const columns = [
    { header: "Date", accessor: "work_date", render: (row) => format(parseISO(row.work_date), "dd MMM yyyy") },
    { header: "Check In", accessor: "check_in", render: (row) => row.check_in ? format(parseISO(row.check_in), "hh:mm a") : '--:--' },
    { header: "Check Out", accessor: "check_out", render: (row) => row.check_out ? format(parseISO(row.check_out), "hh:mm a") : '--:--' },
    { header: "Working Hours", accessor: "hours", render: (row) => calculateHours(row.check_in, row.check_out) },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Tracking" 
        description="Mark your daily attendance, view your monthly timesheet, and track your leaves."
      />

      {/* Action Banner */}
      <Card className="bg-primary-50 border-primary-100 shadow-sm overflow-hidden relative">
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
                {isCheckedOut ? "You have completed your shift for today." : isCheckedIn ? "You are currently checked in." : "Please mark your attendance."}
              </span>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-48 text-lg py-6"
              variant={isCheckedIn && !isCheckedOut ? "danger" : "primary"}
              disabled={isCheckedOut || actionLoading}
              onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isCheckedOut ? (
                <><CheckCircle2 className="mr-2 inline" /> Shift Ended</>
              ) : isCheckedIn ? (
                "Check Out"
              ) : (
                "Check In Now"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          Leave Balances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.length === 0 ? (
            <div className="col-span-full text-slate-500 text-sm">No leave balances found for this year.</div>
          ) : leaveBalances.map((balance) => (
            <Card key={balance.id}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-sm font-medium text-slate-500 mb-1">{balance.leave_type.name}</span>
                <span className="text-2xl font-bold text-primary-600">
                  {balance.allocated_days - balance.used_days} <span className="text-sm font-normal text-slate-400">remaining</span>
                </span>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full" 
                    style={{ width: `${(balance.used_days / balance.allocated_days) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 mt-1">{balance.used_days} used out of {balance.allocated_days}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
          <DataTable columns={columns} data={history} emptyMessage={null} />
        </CardContent>
      </Card>
    </div>
  );
}