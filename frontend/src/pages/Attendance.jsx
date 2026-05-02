import { useEffect, useState } from "react";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Clock, CheckCircle2, History, Loader2, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
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
import {
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getMyLeaveBalances,
} from "../services/attendance";

const EMPLOYEE_ATTENDANCE = [
  {
    id: 1,
    name: "Dev Nair",
    status: "present",
    checkIn: "09:02 AM",
    checkOut: "--:-- PM",
    hours: "--",
    todayStatus: "Checked In",
  },
  {
    id: 2,
    name: "Priya Kapoor",
    status: "present",
    checkIn: "09:15 AM",
    checkOut: "05:30 PM",
    hours: "8h 15m",
    todayStatus: "Checked Out",
  },
  {
    id: 3,
    name: "Rajesh Kumar",
    status: "absent",
    checkIn: "--",
    checkOut: "--",
    hours: "--",
    todayStatus: "Absent",
  },
  {
    id: 4,
    name: "Sneha Patel",
    status: "on_leave",
    checkIn: "--",
    checkOut: "--",
    hours: "--",
    todayStatus: "On Leave",
  },
];

export default function Attendance() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isPrivilegeView = role === 'admin' || role === 'hr_officer' || role === 'payroll_officer';
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  const loadAttendanceData = async () => {
    const [historyData, balancesData] = await Promise.all([
      getMyAttendanceHistory(),
      getMyLeaveBalances(),
    ]);

    setHistory(historyData);
    setLeaveBalances(balancesData);

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayEntry = historyData.find(
      (entry) => entry.work_date === todayStr,
    );

    setIsCheckedIn(!!todayEntry?.check_in);
    setIsCheckedOut(!!todayEntry?.check_out);
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

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        await loadAttendanceData();
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch data:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to realtime updates for attendance
  useRealtime((event) => {
    if (!event) return;
    if (event.type === "attendance") {
      fetchData().catch((err) =>
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
          description="Monitor employee attendance and check-in status across the organization."
        />

        <Card>
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <CardTitle className="text-lg">Employee Attendance</CardTitle>
            </div>
            <Button variant="secondary" size="sm">
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { header: "Employee", accessor: "name" },
                { header: "Today Status", accessor: "todayStatus" },
                { header: "Check In", accessor: "checkIn" },
                { header: "Check Out", accessor: "checkOut" },
                { header: "Hours", accessor: "hours" },
                {
                  header: "Status",
                  accessor: "status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
              ]}
              data={EMPLOYEE_ATTENDANCE}
            />
          </CardContent>
        </Card>

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
    { header: "Emp", accessor: "name" },
    { header: "Check In", accessor: "checkIn", render: (row) => row.checkIn.replace(/ AM| PM/g, '') },
    { header: "Check Out", accessor: "checkOut", render: (row) => row.checkOut.replace(/ AM| PM/g, '') },
    { header: "Work Hours", accessor: "hours" },
    { header: "Extra hours", accessor: "extra_hours", render: (row) => row.extra_hours || "-" }
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
    if (isAdmin) return null;

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

  if (isPrivilegeView) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Attendances" 
          description={isAdmin ? "View and monitor daily employee attendance." : "Mark your attendance and monitor daily employee attendance."}
        />

        {renderActionBanner()}

        <Card>
          <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-center py-4 gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay} className="h-9 w-9" title="Previous Day">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextDay} className="h-9 w-9" title="Next Day">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input 
                type="date"
                value={format(selectedDailyDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDailyDate(new Date(e.target.value));
                  }
                }}
                className="px-3 py-1.5 h-9 border border-slate-200 rounded-md text-sm font-medium bg-white text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="px-3 py-1.5 h-9 border border-slate-200 rounded-md text-sm font-medium bg-slate-50 text-slate-700 flex items-center min-w-[100px] justify-center">
                {format(selectedDailyDate, "EEEE")}
              </div>
            </div>
            
            <div className="ml-auto w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Searchbar" 
                className="w-full px-3 py-1.5 h-9 border border-slate-200 rounded-md text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardHeader>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center bg-slate-50/50">
            <h3 className="text-slate-800 font-semibold">{format(selectedDailyDate, "dd, MMMM yyyy")}</h3>
          </div>
          <CardContent className="p-0">
            <DataTable
              columns={adminColumns}
              data={EMPLOYEE_ATTENDANCE}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Tracking" 
        description="Mark your daily attendance, view your monthly timesheet, and track your leaves."
      />

      {renderActionBanner()}

      {/* Leave Balances Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          Leave Balances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.length === 0 ? (
            <div className="col-span-full text-slate-500 text-sm">
              No leave balances found for this year.
            </div>
          ) : (
            leaveBalances.map((balance) => (
              <Card key={balance.id}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <span className="text-sm font-medium text-slate-500 mb-1">
                    {balance.leave_type.name}
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {balance.allocated_days - balance.used_days}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      remaining
                    </span>
                  </span>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{
                        width: `${(balance.used_days / balance.allocated_days) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400 mt-1">
                    {balance.used_days} used out of {balance.allocated_days}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Monthly grid/History with Wireframe Layout */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9" title="Previous Month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9" title="Next Month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <select 
              value={selectedMonthDate.getMonth()}
              onChange={(e) => {
                const newDate = new Date(selectedMonthDate);
                newDate.setMonth(parseInt(e.target.value, 10));
                setSelectedMonthDate(newDate);
              }}
              className="px-3 py-1.5 h-9 border border-slate-200 rounded-md text-sm font-medium bg-white text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={0}>Jan</option>
              <option value={1}>Feb</option>
              <option value={2}>Mar</option>
              <option value={3}>Apr</option>
              <option value={4}>May</option>
              <option value={5}>Jun</option>
              <option value={6}>Jul</option>
              <option value={7}>Aug</option>
              <option value={8}>Sep</option>
              <option value={9}>Oct</option>
              <option value={10}>Nov</option>
              <option value={11}>Dec</option>
            </select>
            <select 
              value={selectedMonthDate.getFullYear()}
              onChange={(e) => {
                const newDate = new Date(selectedMonthDate);
                newDate.setFullYear(parseInt(e.target.value, 10));
                setSelectedMonthDate(newDate);
              }}
              className="px-3 py-1.5 h-9 border border-slate-200 rounded-md text-sm font-medium bg-white text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex flex-col items-center bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200 min-w-[120px]">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Count of days present</span>
              <span className="text-lg font-bold text-slate-800">{presentCount}</span>
            </div>
            <div className="flex-1 sm:flex-none flex flex-col items-center bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200 min-w-[120px]">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Leaves count</span>
              <span className="text-lg font-bold text-slate-800">{leavesCount}</span>
            </div>
            <div className="flex-1 sm:flex-none flex flex-col items-center bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200 min-w-[120px]">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total working days</span>
              <span className="text-lg font-bold text-slate-800">{totalWorkingDays}</span>
            </div>
          </div>
        </CardHeader>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center bg-slate-50/50">
          <h3 className="text-slate-800 font-semibold">{format(new Date(), "dd, MMMM yyyy")}</h3>
        </div>
        <CardContent className="p-0">
          <DataTable columns={columns} data={history} emptyMessage={null} />
        </CardContent>
      </Card>
    </div>
  );
}
