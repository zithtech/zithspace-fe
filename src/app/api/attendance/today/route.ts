import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, TodayAttendanceStatus } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/attendance/today - Get today's attendance status
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

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member') || session.user.id;

    // Role-based validation
    if (session.user.role === 'user' && memberId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Users can only view their own attendance status',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      member: memberId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('member', 'name workEmail position')
      .populate('shift', 'name code startTime endTime');

    if (!attendance) {
      // No attendance record for today
      const status: TodayAttendanceStatus = {
        isClockIn: false,
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        status: 'absent',
      };

      return NextResponse.json(
        {
          success: true,
          data: status,
        } as ApiResponse,
        { status: 200 }
      );
    }

    // Find current active break
    const currentBreak = attendance.breaks.find((breakItem: any) => 
      breakItem.startTime && !breakItem.endTime
    );

    const status: TodayAttendanceStatus = {
      isClockIn: !!attendance.clockIn,
      clockInTime: attendance.clockIn,
      clockOutTime: attendance.clockOut,
      currentBreak: currentBreak ? {
        type: currentBreak.type,
        startTime: currentBreak.startTime,
        endTime: currentBreak.endTime,
        duration: currentBreak.duration,
      } : undefined,
      totalWorkMinutes: attendance.totalWorkMinutes,
      totalBreakMinutes: attendance.totalBreakMinutes,
      status: attendance.status,
      shift: attendance.shift ? {
        _id: attendance.shift._id,
        name: attendance.shift.name,
        code: attendance.shift.code,
        startTime: attendance.shift.startTime,
        endTime: attendance.shift.endTime,
        workingMinutes: attendance.shift.workingMinutes,
        graceMinutes: attendance.shift.graceMinutes,
        lunchBreakMinutes: attendance.shift.lunchBreakMinutes,
        overtimeThreshold: attendance.shift.overtimeThreshold,
        isFlexible: attendance.shift.isFlexible,
        flexibleStartRange: attendance.shift.flexibleStartRange,
        flexibleEndRange: attendance.shift.flexibleEndRange,
        isActive: attendance.shift.isActive,
        isDefault: attendance.shift.isDefault,
        createdBy: attendance.shift.createdBy,
        createdAt: attendance.shift.createdAt,
        updatedAt: attendance.shift.updatedAt,
      } : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        data: status,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get today attendance status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
