import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, ClockOutData } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// POST /api/attendance/clock-out - Clock out for attendance
export async function POST(request: NextRequest) {
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
      RBAC.validateApiAccess(session.user.role as Role, 'attendance', 'update');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body: ClockOutData = await request.json();
    const { attendanceId, notes } = body;

    let attendance;

    if (attendanceId) {
      // Clock out using specific attendance ID
      attendance = await Attendance.findById(attendanceId);
      
      if (!attendance) {
        return NextResponse.json(
          {
            success: false,
            error: 'Attendance record not found',
          } as ApiResponse,
          { status: 404 }
        );
      }

      // Role-based validation
      if (session.user.role === 'user' && attendance.member.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Users can only clock out for themselves',
          } as ApiResponse,
          { status: 403 }
        );
      }
    } else {
      // Find today's attendance record for current user
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      attendance = await Attendance.findOne({
        member: session.user.id,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      if (!attendance) {
        return NextResponse.json(
          {
            success: false,
            error: 'No attendance record found for today. Please clock in first.',
          } as ApiResponse,
          { status: 404 }
        );
      }
    }

    // Check if already clocked out
    if (attendance.clockOut) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already clocked out',
          data: attendance,
        } as ApiResponse,
        { status: 409 }
      );
    }

    // Check if clocked in
    if (!attendance.clockIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot clock out without clocking in first',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // End any active breaks
    const activeBreaks = attendance.breaks.filter((breakItem: any) => !breakItem.endTime);
    for (const activeBreak of activeBreaks) {
      activeBreak.endTime = new Date();
      activeBreak.duration = Math.round((activeBreak.endTime.getTime() - activeBreak.startTime.getTime()) / (1000 * 60));
    }

    // Update attendance record
    attendance.clockOut = new Date();
    if (notes) attendance.notes = notes;

    await attendance.save();

    // Populate the response
    await attendance.populate('member', 'name workEmail position');
    await attendance.populate('shift', 'name code startTime endTime');

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: 'Clocked out successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Clock out error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
