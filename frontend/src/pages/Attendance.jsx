import { useEffect, useState } from "react";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Clock, CheckCircle2, History, Loader2, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import useRealtime from "../hooks/useRealtime.js";
import api from "../api/axios.js";
import {
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getMyLeaveBalances,
} from "../services/attendance";



function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    primary: "bg-primary-50 text-primary-600 border-primary-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    danger: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <Card className={`border shadow-sm ${colors[color] || colors.primary}`}>
      <CardContent className="p-4 sm:p-6 flex items-center gap-4">
        <div className={`p-2 sm:p-3 rounded-xl bg-white shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-80 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold mt-0.5">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Attendance() {
  const auth = useAuth();
  const role = auth?.role || auth?.user?.role;
  const isAdmin = role === 'admin';
  const isPrivilegeView = role === 'admin' || role === 'hr_officer' || role === 'payroll_officer';
  // Admin has no personal EmployeeProfile, so skip personal endpoints for them
  const hasPersonalProfile = role !== 'admin';

  // ── All hooks must be declared before any early returns ──
  const [activeTab, setActiveTab] = useState("personal");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [allAttendance, setAllAttendance] = useState([]);
  const [stats, setStats] = useState(null);

  const loadAttendanceData = async () => {
    // Build parallel requests — skip personal endpoints for admin (no EmployeeProfile)
    const [historyData, balancesData, statsRes] = await Promise.all([
      hasPersonalProfile ? getMyAttendanceHistory() : Promise.resolve([]),
      hasPersonalProfile ? getMyLeaveBalances() : Promise.resolve([]),
      isPrivilegeView ? api.get("/stats/dashboard") : Promise.resolve({ data: null })
    ]);

    setHistory(historyData);
    setLeaveBalances(balancesData);
    setStats(statsRes.data);

    if (hasPersonalProfile) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayEntry = historyData.find((entry) => entry.work_date === todayStr);
      setIsCheckedIn(!!todayEntry?.check_in);
      setIsCheckedOut(!!todayEntry?.check_out);
    }

    // Load org-wide logs for privileged roles
    if (isPrivilegeView) {
      try {
        const response = await api.get("/attendance/all", {
          params: {
            start_date: format(selectedDailyDate, "yyyy-MM-dd"),
            end_date: format(selectedDailyDate, "yyyy-MM-dd")
          }
        });
        setAllAttendance(response.data || []);
      } catch (err) {
        console.error("Failed to load global attendance", err);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await loadAttendanceData();
    } catch (error) {
      console.error("Failed to load attendance data", error);
    } finally {
      setLoading(false);
    }
  };

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on mount & when date changes
  useEffect(() => {
    fetchData();
  }, [selectedDailyDate]);

  // Subscribe to realtime updates for attendance
  useRealtime((event) => {
    if (!event) return;
    if (event.type === "attendance") {
      loadAttendanceData().catch((err) =>
        console.error("Failed to refresh attendance:", err),
      );
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
    if (!checkIn || !checkOut) return "-";
    const mins = differenceInMinutes(parseISO(checkOut), parseISO(checkIn));
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const columns = [
    {
      header: "Date",
      accessor: "work_date",
      render: (row) => format(parseISO(row.work_date), "dd MMM yyyy"),
    },
    {
      header: "Check In",
      accessor: "check_in",
      render: (row) =>
        row.check_in ? format(parseISO(row.check_in), "hh:mm a") : "--:--",
    },
    {
      header: "Check Out",
      accessor: "check_out",
      render: (row) =>
        row.check_out ? format(parseISO(row.check_out), "hh:mm a") : "--:--",
    },
    {
      header: "Working Hours",
      accessor: "hours",
      render: (row) => calculateHours(row.check_in, row.check_out),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Attendance Overview"
          description="Loading attendance data..."
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  const presentCount = history.filter(h => h.status === 'present' || h.status === 'half_day').length;
  const leavesCount = history.filter(h => h.status === 'on_leave').length;
  const totalWorkingDays = history.length;

  const handlePrevMonth = () => {
    setSelectedMonthDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const adminColumns = [
    { 
      header: "Employee", 
      accessor: "full_name",
      render: (row) => (
        <div className="font-medium text-slate-900">{row.full_name}</div>
      )
    },
    { 
      header: "Check In", 
      render: (row) => row.check_in ? format(parseISO(row.check_in), "hh:mm a") : "--:--" 
    },
    { 
      header: "Check Out", 
      render: (row) => row.check_out ? format(parseISO(row.check_out), "hh:mm a") : "--:--" 
    },
    { 
      header: "Work Hours", 
      render: (row) => calculateHours(row.check_in, row.check_out) 
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (row) => <StatusBadge status={row.status} /> 
    }
  ];

  const handlePrevDay = () => {
    setSelectedDailyDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDailyDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };


  const renderActionBanner = () => {
    return (
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
              <StatusBadge
                status={
                  isCheckedOut
                    ? "checked_out"
                    : isCheckedIn
                      ? "present"
                      : "pending"
                }
              />
              <span className="text-sm text-slate-500">
                {isCheckedOut
                  ? "You have completed your shift."
                  : isCheckedIn
                    ? "You are currently checked in."
                    : "Please mark your attendance."}
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
                <>
                  <CheckCircle2 className="mr-2 inline" /> Shift Ended
                </>
              ) : isCheckedIn ? (
                "Check Out"
              ) : (
                "Check In Now"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (role === "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance Dashboard" description="Monitor organization-wide attendance." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats?.total_headcount || "0"} icon={Users} color="primary" />
          <StatCard title="Present Today" value={stats?.present_today || "0"} icon={Clock} color="success" />
          <StatCard title="On Leave" value={stats?.pending_leaves || "0"} icon={Calendar} color="warning" />
          <StatCard title="Late Arrivals" value={stats?.late_arrivals || "0"} icon={Clock} color="danger" />
        </div>
        <Card>
          <CardHeader className="border-b border-slate-100 flex flex-row items-center py-4 gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevDay}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}><ChevronRight className="w-4 h-4" /></Button>
            <input 
              type="date" 
              value={format(selectedDailyDate, "yyyy-MM-dd")} 
              onChange={(e) => e.target.value && setSelectedDailyDate(new Date(e.target.value))} 
              className="px-3 py-1.5 border rounded-md text-sm" 
            />
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={adminColumns} data={allAttendance} emptyMessage="No logs for today." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "hr_officer" || role === "payroll_officer") {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab("personal")} 
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === "personal" ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            My Attendance
          </button>
          <button 
            onClick={() => setActiveTab("management")} 
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === "management" ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Team Logs
          </button>
        </div>

        {activeTab === "personal" ? (
          <div className="space-y-6">
            {renderActionBanner()}
            <Card>
              <CardHeader>
                <CardTitle>My Attendance History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable columns={columns} data={history} emptyMessage="No history found." />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Employees" value={stats?.total_headcount || "0"} icon={Users} color="primary" />
              <StatCard title="Present Today" value={stats?.present_today || "0"} icon={Clock} color="success" />
              <StatCard title="On Leave" value={stats?.pending_leaves || "0"} icon={Calendar} color="warning" />
              <StatCard title="Late Arrivals" value={stats?.late_arrivals || "0"} icon={Clock} color="danger" />
            </div>
            <Card>
              <CardHeader className="border-b border-slate-100 flex flex-row items-center py-4 gap-4">
                <Button variant="outline" size="icon" onClick={handlePrevDay}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={handleNextDay}><ChevronRight className="w-4 h-4" /></Button>
                <input 
                  type="date" 
                  value={format(selectedDailyDate, "yyyy-MM-dd")} 
                  onChange={(e) => e.target.value && setSelectedDailyDate(new Date(e.target.value))} 
                  className="px-3 py-1.5 border rounded-md text-sm" 
                />
              </CardHeader>
              <CardContent className="p-0">
                <DataTable columns={adminColumns} data={allAttendance} emptyMessage="No logs found for this date." />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Tracking" description="Mark your daily attendance and view your history." />
      {renderActionBanner()}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>My Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={history} emptyMessage="No attendance history found." />
        </CardContent>
      </Card>
    </div>
  );
}
