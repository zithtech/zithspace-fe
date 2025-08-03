import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shift from '@/models/Shift';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/shifts - Get all shifts
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
      RBAC.validateApiAccess(session.user.role as Role, 'shifts', 'read');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const shifts = await Shift.find({ isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: shifts,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get shifts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create new shift
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
      RBAC.validateApiAccess(session.user.role as Role, 'shifts', 'create');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      startTime,
      endTime,
      graceMinutes,
      lunchBreakMinutes,
      overtimeThreshold,
      isFlexible,
      workingMinutes,
    } = body;

    // Validate required fields
    if (!name || !code || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if shift code already exists
    const existingShift = await Shift.findOne({ code: code.toUpperCase() });
    if (existingShift) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shift code already exists',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create new shift
    const shift = new Shift({
      name,
      code: code.toUpperCase(),
      startTime,
      endTime,
      graceMinutes: graceMinutes || 30,
      lunchBreakMinutes: lunchBreakMinutes || 60,
      overtimeThreshold: overtimeThreshold || 480,
      workingMinutes: workingMinutes || 480,
      isFlexible: isFlexible || false,
      isActive: true,
      createdBy: session.user.id,
    });

    await shift.save();

    return NextResponse.json(
      {
        success: true,
        data: shift,
        message: 'Shift created successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Create shift error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
