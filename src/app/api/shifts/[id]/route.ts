import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shift from '@/models/Shift';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// PUT /api/shifts/[id] - Update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check permissions using RBAC //
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'shifts', 'update');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const { id } = await params;
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

    // Find the shift
    const shift = await Shift.findById(id);
    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shift not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if shift code already exists (excluding current shift)
    if (code && code.toUpperCase() !== shift.code) {
      const existingShift = await Shift.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingShift) {
        return NextResponse.json(
          {
            success: false,
            error: 'Shift code already exists',
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Update the shift
    if (name) shift.name = name;
    if (code) shift.code = code.toUpperCase();
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (graceMinutes !== undefined) shift.graceMinutes = graceMinutes;
    if (lunchBreakMinutes !== undefined) shift.lunchBreakMinutes = lunchBreakMinutes;
    if (overtimeThreshold !== undefined) shift.overtimeThreshold = overtimeThreshold;
    if (workingMinutes !== undefined) shift.workingMinutes = workingMinutes;
    if (isFlexible !== undefined) shift.isFlexible = isFlexible;
    
    shift.updatedBy = session.user.id;
    shift.updatedAt = new Date();

    await shift.save();

    return NextResponse.json(
      {
        success: true,
        data: shift,
        message: 'Shift updated successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update shift error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id] - Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      RBAC.validateApiAccess(session.user.role as Role, 'shifts', 'delete');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the shift
    const shift = await Shift.findById(id);
    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shift not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive instead of removing
    shift.isActive = false;
    shift.updatedBy = session.user.id;
    shift.updatedAt = new Date();
    await shift.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Shift deleted successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete shift error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
