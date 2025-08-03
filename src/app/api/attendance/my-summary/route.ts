import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// GET /api/attendance/my-summary - Get user's work hours summary
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const userId = session.user.id;
    const now = dayjs();

    // Calculate date ranges
    let dateFilter: any = { member: userId };

    if (period === 'today') {
      dateFilter.date = {
        $gte: now.startOf('day').toDate(),
        $lte: now.endOf('day').toDate(),
      };
    } else if (period === 'week') {
      dateFilter.date = {
        $gte: now.startOf('isoWeek').toDate(),
        $lte: now.endOf('isoWeek').toDate(),
      };
    } else if (period === 'month') {
      dateFilter.date = {
        $gte: now.startOf('month').toDate(),
        $lte: now.endOf('month').toDate(),
      };
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.date = {
        $gte: dayjs(startDate).startOf('day').toDate(),
        $lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    // Fetch attendance records
    const attendanceRecords = await Attendance.find(dateFilter)
      .sort({ date: -1 })
      .lean();

    // Calculate summaries
    const todayRecord = attendanceRecords.find(record => 
      dayjs(record.date).isSame(now, 'day')
    );

    const thisWeekRecords = attendanceRecords.filter(record =>
      dayjs(record.date).isSame(now, 'isoWeek')
    );

    const thisMonthRecords = attendanceRecords.filter(record =>
      dayjs(record.date).isSame(now, 'month')
    );

    // Calculate work hours
    const calculateWorkHours = (records: any[]) => {
      return records.reduce((total, record) => {
        return total + (record.effectiveWorkMinutes || 0);
      }, 0);
    };

    const calculateOvertime = (records: any[]) => {
      return records.reduce((total, record) => {
        return total + (record.overtimeMinutes || 0);
      }, 0);
    };

    const formatMinutes = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    const summary = {
      today: {
        workMinutes: todayRecord?.effectiveWorkMinutes || 0,
        workHours: formatMinutes(todayRecord?.effectiveWorkMinutes || 0),
        overtimeMinutes: todayRecord?.overtimeMinutes || 0,
        overtimeHours: formatMinutes(todayRecord?.overtimeMinutes || 0),
        status: todayRecord?.status || 'absent',
        clockIn: todayRecord?.clockIn || null,
        clockOut: todayRecord?.clockOut || null,
      },
      thisWeek: {
        workMinutes: calculateWorkHours(thisWeekRecords),
        workHours: formatMinutes(calculateWorkHours(thisWeekRecords)),
        overtimeMinutes: calculateOvertime(thisWeekRecords),
        overtimeHours: formatMinutes(calculateOvertime(thisWeekRecords)),
        daysWorked: thisWeekRecords.filter(r => r.effectiveWorkMinutes > 0).length,
        averagePerDay: thisWeekRecords.length > 0 
          ? formatMinutes(Math.round(calculateWorkHours(thisWeekRecords) / Math.max(thisWeekRecords.filter(r => r.effectiveWorkMinutes > 0).length, 1)))
          : '0h 0m',
      },
      thisMonth: {
        workMinutes: calculateWorkHours(thisMonthRecords),
        workHours: formatMinutes(calculateWorkHours(thisMonthRecords)),
        overtimeMinutes: calculateOvertime(thisMonthRecords),
        overtimeHours: formatMinutes(calculateOvertime(thisMonthRecords)),
        daysWorked: thisMonthRecords.filter(r => r.effectiveWorkMinutes > 0).length,
        averagePerDay: thisMonthRecords.length > 0 
          ? formatMinutes(Math.round(calculateWorkHours(thisMonthRecords) / Math.max(thisMonthRecords.filter(r => r.effectiveWorkMinutes > 0).length, 1)))
          : '0h 0m',
      },
      custom: period === 'custom' && startDate && endDate ? {
        workMinutes: calculateWorkHours(attendanceRecords),
        workHours: formatMinutes(calculateWorkHours(attendanceRecords)),
        overtimeMinutes: calculateOvertime(attendanceRecords),
        overtimeHours: formatMinutes(calculateOvertime(attendanceRecords)),
        daysWorked: attendanceRecords.filter(r => r.effectiveWorkMinutes > 0).length,
        averagePerDay: attendanceRecords.length > 0 
          ? formatMinutes(Math.round(calculateWorkHours(attendanceRecords) / Math.max(attendanceRecords.filter(r => r.effectiveWorkMinutes > 0).length, 1)))
          : '0h 0m',
        dateRange: {
          start: dayjs(startDate).format('MMM DD, YYYY'),
          end: dayjs(endDate).format('MMM DD, YYYY'),
        },
      } : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: summary,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get my summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
