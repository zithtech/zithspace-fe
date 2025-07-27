import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse, UpdateTransactionData } from '@/types';
import { RBAC, type Role } from '@/lib/rbac';

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const transaction = await Transaction.findById(id)
      .populate('member', 'name workEmail position')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check permissions - users can only see their own transactions
    if (session.user.role === 'user' && transaction.member._id.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        } as ApiResponse,
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      RBAC.validateApiAccess(session.user.role as Role, 'transactions', 'update');
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
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const body: UpdateTransactionData = await request.json();
    const { type, amount, member, category, description, notes, date, status, attachments } = body;

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be a positive number',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate member exists if provided
    if (member && !(await User.findById(member))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid member reference',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Update transaction fields
    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (member !== undefined) transaction.member = member;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (notes !== undefined) transaction.notes = notes;
    if (date !== undefined) transaction.date = new Date(date);
    if (status !== undefined) transaction.status = status;
    if (attachments !== undefined) transaction.attachments = attachments;

    await transaction.save();

    // Populate the response
    await transaction.populate('member', 'name workEmail position');
    await transaction.populate('createdBy', 'name');
    await transaction.populate('approvedBy', 'name');

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: 'Transaction updated successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      RBAC.validateApiAccess(session.user.role as Role, 'transactions', 'delete');
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
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    await Transaction.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction deleted successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
