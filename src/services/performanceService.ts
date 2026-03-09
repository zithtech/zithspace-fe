import { apiClient } from "@/lib/axios";
import dayjs from "dayjs";

export interface DashboardData {
  tickets: {
    summary: { completed: number; inProgress: number; pending: number };
    distribution: Array<{ name: string; value: number; color: string }>;
    trend: Array<{ name: string; Created: number; Completed: number }>;
    details: any[];
  };
  attendance: {
    summary: { avgHours: string; late: number; early: number; present: number; absent: number; avgClockIn: string; avgClockOut: string };
    trend: any[];
    logs: any[];
  };
  dailyUpdates: {
    summary: { bod: string; eod: string; missed: number; workingDays: number; present: number };
    logs: any[];
  };
  leaves: {
    summary: { taken: number; permissions: string; paidUnpaid: string; attendanceRate: string };
    history: any[];
  };
}

class PerformanceService {
  /**
   * Fetch all performance data for a specific employee and date range
   * Aggregates data from Tickets, Attendance, DailyUpdates, and Leaves APIs
   */
  static async getDashboardData(
    userId: string,
    month: string,
    year: string
  ): Promise<DashboardData> {
    try {
      // Calculate Date Range
      const selectedYear = parseInt(year);
      const selectedMonth = parseInt(month) - 1; // 0-indexed
      const startDate = dayjs().year(selectedYear).month(selectedMonth).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().year(selectedYear).month(selectedMonth).endOf("month").format("YYYY-MM-DD");

      // Fetch all data in parallel
      const [ticketsRes, attendanceRes, updatesRes, leavesRes] = await Promise.all([
        apiClient.get("/api/tickets", {
          params: { assigneeId: userId, startDate, endDate, limit: 100 },
        }),
        apiClient.get("/api/attendance", {
          params: { userId, startDate, endDate, limit: 100 },
        }),
        apiClient.get("/api/daily-updates/team", {
          params: { userId, startDate, endDate }, 
        }),
        apiClient.get("/api/leaves", {
          params: { userId }, // Admin route to get leaves for user
        }),
      ]);

      // --- PROCESS DATA ---

      // 1. Tickets
      const tickets = ticketsRes.data.data || [];
      const completed = tickets.filter((t: any) => {
        const status = t.status?.toLowerCase();
        return ["completed", "dev_complete"].includes(status);
      }).length;
      const inProgress = tickets.filter((t: any) => {
        const status = t.status?.toLowerCase();
        return ["in progress", "in_progress", "in_testing"].includes(status);
      }).length;
      const pending = tickets.filter((t: any) => {
        const status = t.status?.toLowerCase();
        return ["pending", "open", "to do", "not_started"].includes(status);
      }).length;

      // Calculate Ticket Trend (Daily for the selected month)
      const daysInMonth = dayjs(endDate).date();
      const ticketTrendMap = new Map<string, { name: string; Created: number; Completed: number }>();
      
      // Initialize all days with 0
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const dateStr = dayjs(startDate).date(i).format("YYYY-MM-DD");
        ticketTrendMap.set(dateStr, { name: dayStr, Created: 0, Completed: 0 });
      }

      tickets.forEach((t: any) => {
        const createdDate = dayjs(t.createdAt).format("YYYY-MM-DD");
        if (ticketTrendMap.has(createdDate)) {
          ticketTrendMap.get(createdDate)!.Created++;
        }
        if (t.status === "Completed" && t.closedAt) {
          const closedDate = dayjs(t.closedAt).format("YYYY-MM-DD");
          if (ticketTrendMap.has(closedDate)) {
            ticketTrendMap.get(closedDate)!.Completed++;
          }
        }
      });

      // 2. Attendance
      const attendanceLogs = attendanceRes.data.data || [];
      let totalWorkMinutes = 0;
      let lateCount = 0;
      let earlyCount = 0;
      let totalClockInMins = 0;
      let clockInCount = 0;
      let totalClockOutMins = 0;
      let clockOutCount = 0;

      attendanceLogs.forEach((log: any) => {
        if (log.totalWorkMinutes) {
          totalWorkMinutes += Number(log.totalWorkMinutes);
        }
        if (log.lateMinutes && Number(log.lateMinutes) > 0) {
          lateCount++;
        }
        if ((log.earlyMinutes && Number(log.earlyMinutes) > 0) || log.status === 'Early') {
          earlyCount++;
        }
        if (log.clockIn) {
          const t = dayjs(log.clockIn);
          totalClockInMins += t.hour() * 60 + t.minute();
          clockInCount++;
        }
        if (log.clockOut) {
          const t = dayjs(log.clockOut);
          totalClockOutMins += t.hour() * 60 + t.minute();
          clockOutCount++;
        }
      });
      const avgHours = attendanceLogs.length ? (totalWorkMinutes / attendanceLogs.length / 60).toFixed(1) : "0";

      const minsToTime = (total: number, count: number) => {
        if (count === 0) return "-";
        const avg = Math.floor(total / count);
        const h = Math.floor(avg / 60);
        const m = avg % 60;
        return dayjs().hour(h).minute(m).format("hh:mm A");
      };

      const avgClockIn = minsToTime(totalClockInMins, clockInCount);
      const avgClockOut = minsToTime(totalClockOutMins, clockOutCount);

      // Calculate Working Days in Month (excluding weekends)
      let workingDays = 0;
      let currentDay = dayjs(startDate);
      const endDay = dayjs(endDate);
      while (currentDay.isBefore(endDay) || currentDay.isSame(endDay, 'day')) {
        if (currentDay.day() !== 0 && currentDay.day() !== 6) workingDays++;
        currentDay = currentDay.add(1, 'day');
      }

      // Calculate Attendance Trend (Daily hours)
      const attendanceTrendMap = new Map<string, { name: string; hours: number }>();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const dateStr = dayjs(startDate).date(i).format("YYYY-MM-DD");
        attendanceTrendMap.set(dateStr, { name: dayStr, hours: 0 });
      }
      
      attendanceLogs.forEach((log: any) => {
        const dateStr = dayjs(log.date).format("YYYY-MM-DD");
        if (attendanceTrendMap.has(dateStr) && log.effectiveWorkMinutes) {
          attendanceTrendMap.get(dateStr)!.hours = parseFloat((log.effectiveWorkMinutes / 60).toFixed(2));
        }
      });

      // 3. Daily Updates
      const updates = updatesRes.data.data || [];
      // Filter updates to ensure they are within the selected month (API usually handles this, but double check)
      const monthlyUpdates = updates.filter((u: any) => dayjs(u.date).isAfter(dayjs(startDate).subtract(1, 'day')) && dayjs(u.date).isBefore(dayjs(endDate).add(1, 'day')));
      
      const bodCount = monthlyUpdates.filter((u: any) => u.updateType === 'BOD' || (u.projectUpdates && u.projectUpdates.length > 0)).length;
      const eodCount = monthlyUpdates.filter((u: any) => u.updateType === 'EOD' || u.totalHoursWorked).length;
      const missed = updates.filter((u: any) => u.is_missed === true).length;

      // 4. Leaves
      const leaves = leavesRes.data.data || [];
      // Filter leaves for the selected month
      const monthlyLeaves = leaves.filter((l: any) => {
        const d = dayjs(l.startDate);
        return d.isAfter(dayjs(startDate).subtract(1, 'day')) && d.isBefore(dayjs(endDate).add(1, 'day'));
      });
      const approvedRequests = monthlyLeaves.filter((l: any) => l.status?.toLowerCase() === "approved");
      const leavesTaken = approvedRequests.filter((l: any) => l.type?.toLowerCase() !== 'permission').reduce((acc: number, l: any) => acc + (parseFloat(l.duration) || 0), 0);
      const permissions = approvedRequests.filter((l: any) => l.type?.toLowerCase() === 'permission').length;
      
      const paidLeaves = approvedRequests.filter((l: any) => !['unpaid', 'lop', 'loss of pay'].includes(l.type?.toLowerCase())).reduce((acc: number, l: any) => acc + (parseFloat(l.duration) || 0), 0);
      const unpaidLeaves = approvedRequests.filter((l: any) => ['unpaid', 'lop', 'loss of pay'].includes(l.type?.toLowerCase())).reduce((acc: number, l: any) => acc + (parseFloat(l.duration) || 0), 0);
      const paidUnpaid = `${paidLeaves} / ${unpaidLeaves}`;

      const attendanceRate = workingDays > 0 ? Math.round((attendanceLogs.length / workingDays) * 100) : 0;

      // --- CONSTRUCT RESPONSE ---
      return {
        tickets: {
          summary: { completed, inProgress, pending },
          distribution: [
            { name: "Completed", value: completed, color: "#52c41a" },
            { name: "In Progress", value: inProgress, color: "#faad14" },
            { name: "Pending", value: pending, color: "#f5222d" },
          ],
          trend: Array.from(ticketTrendMap.values()),
          details: tickets.slice(0, 10).map((t: any) => ({
            key: t._id || t.id,
            ticketId: t.ticketNumber || t.ticketId || "TKT-###",
            status: t.status,
            priority: t.priority,
            created: dayjs(t.createdAt).format("YYYY-MM-DD"),
            closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
          })),
        },
        attendance: {
          summary: { avgHours: `${avgHours}h`, late: lateCount, early: earlyCount, present: attendanceLogs.length, absent: 0, avgClockIn, avgClockOut },
          trend: Array.from(attendanceTrendMap.values()),
          logs: attendanceLogs.slice(0, 10).map((a: any) => {
            const hoursVal = a.totalHours || (a.totalWorkMinutes ? (Number(a.totalWorkMinutes) / 60).toFixed(1) : "0");
            return {
            key: a._id || a.id,
            date: dayjs(a.date).format("YYYY-MM-DD"),
            clockIn: a.clockIn ? dayjs(a.clockIn).format("hh:mm A") : "-",
            clockOut: a.clockOut ? dayjs(a.clockOut).format("hh:mm A") : "-",
            hours: `${hoursVal}h`,
            status: a.status || "Present",
          }}),
        },
        dailyUpdates: {
          summary: { bod: `${bodCount}`, eod: `${eodCount}`, missed, workingDays, present: attendanceLogs.length },
          logs: monthlyUpdates.slice(0, 10).map((u: any) => ({
            key: u._id || u.id,
            date: dayjs(u.date).format("YYYY-MM-DD"),
            bod: !!(u.bod || u.projectUpdates?.length),
            eod: !!(u.eod || u.totalHoursWorked),
            remarks: u.generalNotes || (u.mood ? `Mood: ${u.mood}` : ""),
          })),
        },
        leaves: {
          summary: { taken: leavesTaken, permissions: `${permissions}`, paidUnpaid: paidUnpaid, attendanceRate: `${attendanceRate}%` },
          history: monthlyLeaves.slice(0, 5).map((l: any) => ({
            key: l._id || l.id,
            from: dayjs(l.startDate).format("YYYY-MM-DD"),
            to: l.endDate ? dayjs(l.endDate).format("YYYY-MM-DD") : dayjs(l.startDate).format("YYYY-MM-DD"),
            type: l.leaveType,
            duration: l.duration || "Full Day",
            reason: l.reason,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching performance dashboard data:", error);
      throw error;
    }
  }
}

export default PerformanceService; 






