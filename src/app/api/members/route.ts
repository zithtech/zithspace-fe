import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, CreateUserData, PaginatedResponse } from '@/types';

const canViewMembers = (role: string) => ['super admin', 'admin'].includes(role);
const canManageMembers = (role: string) => role === 'super admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!canViewMembers(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const position = searchParams.get('position') || '';

    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { personalEmail: { $regex: search, $options: 'i' } },
        { workEmail: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (position) query.position = position;

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const members = await User.find(query)
      .select('-password')
      .populate('reportsTo', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const response: PaginatedResponse<any> = {
      data: members,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!canManageMembers(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: CreateUserData = await request.json();
    const { name, phone, personalEmail, workEmail, role, position, reportsTo } = body;

    if (!name || !phone || !personalEmail || !workEmail || !role || !position) {
      return NextResponse.json({ success: false, error: 'All required fields must be provided' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [
        { personalEmail: personalEmail.toLowerCase() },
        { workEmail: workEmail.toLowerCase() },
        { phone },
      ],
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email or phone already exists' }, { status: 409 });
    }

    if (reportsTo && !await User.findById(reportsTo)) {
      return NextResponse.json({ success: false, error: 'Invalid manager reference' }, { status: 400 });
    }

    const newUser = new User({
      name,
      phone,
      personalEmail: personalEmail.toLowerCase(),
      workEmail: workEmail.toLowerCase(),
      role,
      position,
      reportsTo: reportsTo || null,
      password: process.env.DEFAULT_PASSWORD,
    });

    await newUser.save();
    await newUser.populate('reportsTo', 'name');

    return NextResponse.json({ success: true, data: newUser, message: 'Member created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Failed to create member:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
