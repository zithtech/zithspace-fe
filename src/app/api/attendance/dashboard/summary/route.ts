import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, DashboardSummary } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/attendance/dashboard/summary - Get today's attendance summary
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

    // Check permissions using RBAC
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'attendance', 'read');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const todayWeekday = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get all active members
    const allMembers = await User.find({ isActive: true }).select('_id name workDays assignedShift');

    // Filter members who should be working today based on their workDays
    const expectedTodayMembers = allMembers.filter(member => 
      member.workDays && member.workDays.includes(todayWeekday)
    );

    // Get today's attendance records
    const todayAttendance = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate('member', '_id name');

    // Calculate metrics
    const totalMembers = allMembers.length;
    const expectedToday = expectedTodayMembers.length;
    const presentToday = todayAttendance.filter(att => 
      att.clockIn && ['present', 'late', 'wfh'].includes(att.status)
    ).length;
    const absentToday = expectedToday - presentToday;
    const lateToday = todayAttendance.filter(att => att.status === 'late').length;
    const wfhToday = todayAttendance.filter(att => att.status === 'wfh').length;
    const attendanceRate = expectedToday > 0 ? Math.round((presentToday / expectedToday) * 100) : 0;

    const summary: DashboardSummary = {
      totalMembers,
      expectedToday,
      presentToday,
      absentToday,
      attendanceRate,
      lateToday,
      wfhToday,
    };

    return NextResponse.json(
      {
        success: true,
        data: summary,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
