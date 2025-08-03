import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, CreateAttendanceData, PaginatedResponse } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/attendance - List attendance records
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const member = searchParams.get('member') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};

    // Role-based filtering
    if (session.user.role === 'user') {
      // Users can only see their own attendance
      query.member = session.user.id;
    } else if (session.user.role === 'admin') {
      // Admins can see their team's attendance (users who report to them)
      const teamMembers = await User.find({ reportsTo: session.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(session.user.id); // Include admin's own attendance
      query.member = { $in: teamMemberIds };
    }
    // Super admins can see all attendance (no additional filter)

    // Apply filters
    if (member && session.user.role !== 'user') {
      query.member = member;
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    // Search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { workEmail: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      query.$or = [
        { member: { $in: userIds } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Attendance.countDocuments(query);
    
    const attendanceRecords = await Attendance.find(query)
      .populate('member', 'name workEmail position')
      .populate('shift', 'name code startTime endTime')
      .populate('enteredBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const response: PaginatedResponse<any> = {
      data: attendanceRecords,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create attendance record
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
      RBAC.validateApiAccess(session.user.role as Role, 'attendance', 'create');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body: CreateAttendanceData = await request.json();
    const { member, date, clockIn, clockOut, status, shift, notes } = body;

    // Validate required fields
    if (!member || !date || !status || !shift) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member, date, status, and shift are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Role-based validation
    if (session.user.role === 'user' && member !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Users can only create their own attendance records',
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Validate member exists
    const memberExists = await User.findById(member);
    if (!memberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid member reference',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate shift exists
    const shiftExists = await Shift.findById(shift);
    if (!shiftExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid shift reference',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if attendance already exists for this member and date
    const existingAttendance = await Attendance.findOne({
      member,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record already exists for this date',
        } as ApiResponse,
        { status: 409 }
      );
    }

    // Create attendance record
    const attendance = new Attendance({
      member,
      date: new Date(date),
      clockIn: clockIn ? new Date(clockIn) : undefined,
      clockOut: clockOut ? new Date(clockOut) : undefined,
      status,
      shift,
      notes,
      isManualEntry: true,
      enteredBy: session.user.id,
      breaks: [],
    });

    await attendance.save();

    // Populate the response
    await attendance.populate('member', 'name workEmail position');
    await attendance.populate('shift', 'name code startTime endTime');
    await attendance.populate('enteredBy', 'name');

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: 'Attendance record created successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Create attendance error:', error);
    
    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record already exists for this date',
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
