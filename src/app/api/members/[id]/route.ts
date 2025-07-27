import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { UpdateUserData } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Check permissions using RBAC
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'members', 'read');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { id } = await params;
    const member = await User.findById(id).select('-password').populate('reportsTo', 'name');

    if (!member || !member.isActive) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Failed to fetch member:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Check permissions using RBAC
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'members', 'update');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdateUserData = await request.json();

    const existingMember = await User.findById(id);
    if (!existingMember || !existingMember.isActive) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    if (body.personalEmail || body.workEmail) {
      const emailQuery: any = { _id: { $ne: id }, $or: [] };
      if (body.personalEmail) emailQuery.$or.push({ personalEmail: body.personalEmail.toLowerCase() });
      if (body.workEmail) emailQuery.$or.push({ workEmail: body.workEmail.toLowerCase() });

      const conflictingUser = await User.findOne(emailQuery);
      if (conflictingUser) {
        return NextResponse.json({ success: false, error: 'Email already exists for another user' }, { status: 409 });
      }
    }

    if (body.reportsTo) {
      if (body.reportsTo === id) {
        return NextResponse.json({ success: false, error: 'User cannot report to themselves' }, { status: 400 });
      }
      if (!await User.findById(body.reportsTo)) {
        return NextResponse.json({ success: false, error: 'Invalid manager reference' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.personalEmail) updateData.personalEmail = body.personalEmail.toLowerCase();
    if (body.workEmail) updateData.workEmail = body.workEmail.toLowerCase();
    if (body.role) updateData.role = body.role;
    if (body.position) updateData.position = body.position;
    if (body.reportsTo !== undefined) updateData.reportsTo = body.reportsTo;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedMember = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .select('-password')
      .populate('reportsTo', 'name');

    return NextResponse.json({ success: true, data: updatedMember, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Check permissions using RBAC
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'members', 'delete');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    const member = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password');

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Failed to delete member:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
