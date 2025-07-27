import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';
import bcrypt from 'bcryptjs';

// PUT /api/user/password - Change user password
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
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password and new password are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be at least 6 characters long',
        } as ApiResponse,
        { status: 400 }
      );
    }

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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password is incorrect',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be different from current password',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Update the password directly in the database to avoid double hashing
    // The User model's pre-save hook will handle the hashing
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
