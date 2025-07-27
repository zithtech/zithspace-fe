import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, CreateTransactionData, PaginatedResponse } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/transactions - List all transactions with pagination and filtering
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const member = searchParams.get('member') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query based on user role
    const query: any = {};

    // Role-based filtering
    if (session.user.role === 'user') {
      // Users can only see their own transactions
      query.member = session.user.id;
    }

    // Apply filters
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (member) {
      query.member = member;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Get transactions with populated fields
    const transactions = await Transaction.find(query)
      .populate('member', 'name workEmail position')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const response: PaginatedResponse<any> = {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
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

    // Check permissions using RBAC
    try {
      RBAC.validateApiAccess(session.user.role as Role, 'transactions', 'create');
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body: CreateTransactionData = await request.json();
    const { type, amount, member, category, description, notes, date, attachments } = body;

    // Validate required fields
    if (!type || !amount || !member || !category || !description || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'All required fields must be provided',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be a positive number',
        } as ApiResponse,
        { status: 400 }
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

    // Create new transaction
    const newTransaction = new Transaction({
      type,
      amount,
      member,
      category,
      description,
      notes: notes || '',
      date: new Date(date),
      attachments: attachments || [],
      createdBy: session.user.id,
      approvedBy: session.user.id, // Auto-approve for now
      status: 'approved',
    });

    await newTransaction.save();

    // Populate the response
    await newTransaction.populate('member', 'name workEmail position');
    await newTransaction.populate('createdBy', 'name');
    await newTransaction.populate('approvedBy', 'name');

    return NextResponse.json(
      {
        success: true,
        data: newTransaction,
        message: 'Transaction created successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
