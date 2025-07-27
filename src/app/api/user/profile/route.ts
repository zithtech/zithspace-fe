import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
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

    // Get user profile
    const user = await User.findById(session.user.id)
      .select('-password')
      .populate('reportsTo', 'name position');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
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

    const body = await request.json();
    const { name, phone, personalEmail, workEmail, dateOfBirth } = body;

    // Find the user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check for email conflicts with other users
    if (personalEmail && personalEmail !== user.personalEmail) {
      const existingUser = await User.findOne({
        personalEmail: personalEmail.toLowerCase(),
        _id: { $ne: session.user.id },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Personal email already exists',
          } as ApiResponse,
          { status: 409 }
        );
      }
    }

    if (workEmail && workEmail !== user.workEmail) {
      const existingUser = await User.findOne({
        workEmail: workEmail.toLowerCase(),
        _id: { $ne: session.user.id },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Work email already exists',
          } as ApiResponse,
          { status: 409 }
        );
      }
    }

    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: session.user.id },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone number already exists',
          } as ApiResponse,
          { status: 409 }
        );
      }
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (personalEmail !== undefined) user.personalEmail = personalEmail.toLowerCase();
    if (workEmail !== undefined) user.workEmail = workEmail.toLowerCase();
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    await user.save();

    // Populate the response
    await user.populate('reportsTo', 'name position');

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'Profile updated successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
