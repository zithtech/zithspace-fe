import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/lib/auth.config';
import { ApiResponse } from '@/types';

// GET /api/transactions/summary - Get financial summary
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const member = searchParams.get('member');

    // Build query based on user role and filters
    const query: any = { status: 'approved' };

    // Role-based filtering
    if (session.user.role === 'user') {
      query.member = session.user.id;
    } else if (member) {
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

    // Get overall balance
    const balanceResult = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const credits = balanceResult.find(r => r._id === 'credit')?.total || 0;
    const debits = balanceResult.find(r => r._id === 'debit')?.total || 0;
    const creditCount = balanceResult.find(r => r._id === 'credit')?.count || 0;
    const debitCount = balanceResult.find(r => r._id === 'debit')?.count || 0;

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          credits: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'credit'] }, '$total', 0],
            },
          },
          debits: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'debit'] }, '$total', 0],
            },
          },
          creditCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'credit'] }, '$count', 0],
            },
          },
          debitCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'debit'] }, '$count', 0],
            },
          },
        },
      },
      {
        $project: {
          category: '$_id',
          credits: 1,
          debits: 1,
          total: { $subtract: ['$credits', '$debits'] },
          creditCount: 1,
          debitCount: 1,
          totalCount: { $add: ['$creditCount', '$debitCount'] },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          ...query,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
          },
          credits: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'credit'] }, '$total', 0],
            },
          },
          debits: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'debit'] }, '$total', 0],
            },
          },
          totalTransactions: { $sum: '$count' },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          credits: 1,
          debits: 1,
          net: { $subtract: ['$credits', '$debits'] },
          totalTransactions: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find(query)
      .populate('member', 'name workEmail position')
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    const summary = {
      balance: {
        credits,
        debits,
        net: credits - debits,
        creditCount,
        debitCount,
        totalCount: creditCount + debitCount,
      },
      categoryBreakdown,
      monthlyTrend,
      recentTransactions,
    };

    return NextResponse.json(
      {
        success: true,
        data: summary,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get transaction summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
