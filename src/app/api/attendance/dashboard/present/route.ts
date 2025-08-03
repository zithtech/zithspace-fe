import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, PresentEmployee } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/attendance/dashboard/present - Get today's present employees
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

    // Get today's attendance records for present employees
    const presentAttendance = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      clockIn: { $exists: true },
      status: { $in: ['present', 'late', 'wfh'] },
    })
      .populate('member', 'name position')
      .populate('shift', 'name code startTime endTime')
      .sort({ clockIn: 1 });

    // Transform to PresentEmployee format
    const presentEmployees: PresentEmployee[] = presentAttendance.map(attendance => {
      const member = typeof attendance.member === 'object' ? attendance.member : null;
      const shift = typeof attendance.shift === 'object' ? attendance.shift : null;
      
      return {
        _id: attendance._id,
        name: member?.name || 'Unknown',
        position: member?.position || 'Unknown',
        clockInTime: attendance.clockIn!,
        shift: shift ? {
          _id: shift._id,
          name: shift.name,
          code: shift.code,
          startTime: shift.startTime,
          endTime: shift.endTime,
          workingMinutes: shift.workingMinutes,
          graceMinutes: shift.graceMinutes,
          lunchBreakMinutes: shift.lunchBreakMinutes,
          overtimeThreshold: shift.overtimeThreshold,
          isFlexible: shift.isFlexible,
          flexibleStartRange: shift.flexibleStartRange,
          flexibleEndRange: shift.flexibleEndRange,
          isActive: shift.isActive,
          isDefault: shift.isDefault,
          createdBy: shift.createdBy,
          createdAt: shift.createdAt,
          updatedAt: shift.updatedAt,
        } : {
          _id: '',
          name: 'Unknown Shift',
          code: 'UK',
          startTime: '09:00',
          endTime: '18:00',
          workingMinutes: 480,
          graceMinutes: 15,
          lunchBreakMinutes: 60,
          overtimeThreshold: 0,
          isFlexible: false,
          isActive: true,
          isDefault: false,
          createdBy: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        workHours: attendance.effectiveWorkMinutes,
        status: attendance.status as 'present' | 'late' | 'wfh',
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: presentEmployees,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get present employees error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
