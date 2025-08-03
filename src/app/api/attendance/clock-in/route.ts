import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, ClockInData } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// POST /api/attendance/clock-in - Clock in for attendance
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

    const body: ClockInData = await request.json();
    const { member, shift, notes } = body;

    // Default to current user if no member specified
    const memberId = member || session.user.id;

    // Role-based validation
    if (session.user.role === 'user' && memberId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Users can only clock in for themselves',
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Validate member exists
    const memberExists = await User.findById(memberId);
    if (!memberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid member reference',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get shift - use provided shift or member's default shift
    let shiftId = shift;
    if (!shiftId) {
      const defaultShift = await Shift.findOne({ isDefault: true, isActive: true });
      if (!defaultShift) {
        return NextResponse.json(
          {
            success: false,
            error: 'No default shift found. Please specify a shift.',
          } as ApiResponse,
          { status: 400 }
        );
      }
      shiftId = defaultShift._id.toString();
    }

    // Validate shift exists
    const shiftExists = await Shift.findById(shiftId);
    if (!shiftExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid shift reference',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      member: memberId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (existingAttendance) {
      if (existingAttendance.clockIn) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already clocked in today',
            data: existingAttendance,
          } as ApiResponse,
          { status: 409 }
        );
      } else {
        // Update existing record with clock in time
        existingAttendance.clockIn = new Date();
        existingAttendance.shift = shiftExists._id;
        if (notes) existingAttendance.notes = notes;
        
        await existingAttendance.save();
        
        // Populate the response
        await existingAttendance.populate('member', 'name workEmail position');
        await existingAttendance.populate('shift', 'name code startTime endTime');
        
        return NextResponse.json(
          {
            success: true,
            data: existingAttendance,
            message: 'Clocked in successfully',
          } as ApiResponse,
          { status: 200 }
        );
      }
    }

    // Create new attendance record
    const attendance = new Attendance({
      member: memberId,
      date: new Date(),
      clockIn: new Date(),
      shift: shiftExists._id,
      status: 'present', // Will be calculated in pre-save hook
      notes,
      isManualEntry: false,
      breaks: [],
    });

    await attendance.save();

    // Populate the response
    await attendance.populate('member', 'name workEmail position');
    await attendance.populate('shift', 'name code startTime endTime');

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: 'Clocked in successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Clock in error:', error);
    
    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record already exists for today',
        } as ApiResponse,
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
