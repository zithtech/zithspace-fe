import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'credit' | 'debit';
  amount: number;
  member: mongoose.Types.ObjectId;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['credit', 'debit'],
        message: 'Type must be either credit or debit',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value > 0;
        },
        message: 'Amount must be a valid positive number',
      },
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['salary', 'expense', 'client_payment', 'office_expense', 'bonus', 'investment', 'refund', 'other'],
        message: 'Category must be one of the predefined values',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'approved', // Auto-approve for now, can be changed based on role/amount
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    attachments: [{
      type: String,
      trim: true,
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes for better query performance
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ member: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdBy: 1 });
TransactionSchema.index({ createdAt: -1 });

// Compound indexes for common queries
TransactionSchema.index({ member: 1, date: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ category: 1, date: -1 });

// Virtual for formatted amount
TransactionSchema.virtual('formattedAmount').get(function(this: ITransaction) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(this.amount);
});

// Static methods
TransactionSchema.statics.getAccountBalance = async function() {
  const result = await this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const credits = result.find(r => r._id === 'credit')?.total || 0;
  const debits = result.find(r => r._id === 'debit')?.total || 0;
  
  return {
    credits,
    debits,
    balance: credits - debits,
  };
};

TransactionSchema.statics.getMemberBalance = async function(memberId: string) {
  const result = await this.aggregate([
    { 
      $match: { 
        member: new mongoose.Types.ObjectId(memberId),
        status: 'approved' 
      } 
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const credits = result.find(r => r._id === 'credit')?.total || 0;
  const debits = result.find(r => r._id === 'debit')?.total || 0;
  
  return {
    credits,
    debits,
    balance: credits - debits,
  };
};

TransactionSchema.statics.getMonthlySummary = async function(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'approved',
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            total: '$total',
            count: '$count',
          },
        },
        totalAmount: { $sum: '$total' },
        totalCount: { $sum: '$count' },
      },
    },
  ]);
};

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
