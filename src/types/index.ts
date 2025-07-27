export interface User {
  _id: string;
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer' | 'CEO' |'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string | { _id: string; name: string };
  password: string;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer'| 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  role?: 'super admin' | 'admin' | 'user';
  position?: 'Developer'| 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  position?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Transaction interfaces
export interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  member: User | string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User | string;
  attachments?: string[];
  createdBy: User | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionData {
  type: 'credit' | 'debit';
  amount: number;
  member: string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
  attachments?: string[];
}

export interface UpdateTransactionData {
  type?: 'credit' | 'debit';
  amount?: number;
  member?: string;
  category?: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'investment' | 'refund' | 'other';
  description?: string;
  notes?: string;
  date?: Date;
  status?: 'pending' | 'approved' | 'rejected';
  attachments?: string[];
}

export interface AccountBalance {
  credits: number;
  debits: number;
  balance: number;
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
  categoryBreakdown: {
    category: string;
    credits: number;
    debits: number;
    total: number;
  }[];
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'super admin' | 'admin' | 'user';
      position: string;
      personalEmail: string;
      workEmail: string;
      phone: string;
      reportsTo: string | null;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: 'super admin' | 'admin' | 'user';
    position: string;
    personalEmail: string;
    workEmail: string;
    phone: string;
    reportsTo: string | null;
    isActive: boolean;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    position: string;
    personalEmail: string;
    workEmail: string;
    phone: string;
    reportsTo: string | null;
    isActive: boolean;
  }
}

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}
