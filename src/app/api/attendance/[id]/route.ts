import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Shift from '@/models/Shift';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { date, clockIn, clockOut } = body;

    // Find the attendance record
    const attendance = await Attendance.findById(id).populate('member shift');
    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Update the record
    if (date) attendance.date = new Date(date);
    if (clockIn !== undefined) attendance.clockIn = clockIn ? new Date(clockIn) : null;
    if (clockOut !== undefined) attendance.clockOut = clockOut ? new Date(clockOut) : null;

    // Recalculate work hours and status if times are provided
    if (attendance.clockIn && attendance.clockOut) {
      const workMinutes = Math.floor(
        (new Date(attendance.clockOut).getTime() - new Date(attendance.clockIn).getTime()) / (1000 * 60)
      );
      attendance.totalWorkMinutes = Math.max(0, workMinutes - (attendance.shift?.lunchBreakMinutes || 60));
      attendance.effectiveWorkMinutes = attendance.totalWorkMinutes;

      // Calculate overtime
      const shiftMinutes = attendance.shift?.workingMinutes || 480;
      attendance.overtimeMinutes = Math.max(0, attendance.totalWorkMinutes - shiftMinutes);

      // Determine status based on clock-in time and shift
      if (attendance.shift) {
        const shift = attendance.shift;
        const clockInTime = new Date(attendance.clockIn);
        const shiftStartTime = new Date(attendance.date);
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        shiftStartTime.setHours(startHour, startMinute, 0, 0);
        
        const gracePeriodEnd = new Date(shiftStartTime.getTime() + (shift.graceMinutes * 60 * 1000));
        
        if (shift.isFlexible) {
          attendance.status = 'present';
        } else {
          attendance.status = clockInTime <= gracePeriodEnd ? 'present' : 'late';
        }
      }
    } else if (attendance.clockIn && !attendance.clockOut) {
      // Only clock in, calculate current work time
      const now = new Date();
      const workMinutes = Math.floor(
        (now.getTime() - new Date(attendance.clockIn).getTime()) / (1000 * 60)
      );
      attendance.totalWorkMinutes = Math.max(0, workMinutes);
      attendance.effectiveWorkMinutes = attendance.totalWorkMinutes;
      attendance.overtimeMinutes = 0;

      // Determine status
      if (attendance.shift) {
        const shift = attendance.shift;
        const clockInTime = new Date(attendance.clockIn);
        const shiftStartTime = new Date(attendance.date);
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        shiftStartTime.setHours(startHour, startMinute, 0, 0);
        
        const gracePeriodEnd = new Date(shiftStartTime.getTime() + (shift.graceMinutes * 60 * 1000));
        
        if (shift.isFlexible) {
          attendance.status = 'present';
        } else {
          attendance.status = clockInTime <= gracePeriodEnd ? 'present' : 'late';
        }
      }
    }

    attendance.isManualEntry = true;
    attendance.enteredBy = session.user.id;

    await attendance.save();

    // Populate the response
    await attendance.populate('member', 'name position');
    await attendance.populate('shift', 'name code startTime endTime');

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: 'Attendance record updated successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      RBAC.validateApiAccess(session.user.role as Role, 'attendance', 'delete');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const { id } = params;

    // Find and delete the attendance record
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance record deleted successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
