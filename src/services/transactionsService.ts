import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  member: {
    id: string;
    name: string;
    position: string;
  } | string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  type: 'credit' | 'debit';
  amount: number;
  member: string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: Date;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'credit' | 'debit';
  category?: string;
  member?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionSummary {
  balance: {
    credits: number;
    debits: number;
    net: number;
    creditCount: number;
    debitCount: number;
    totalCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    credits: number;
    debits: number;
    net: number;
  }>;
  recentTransactions: Transaction[];
}

export class TransactionsService {
  /**
   * Get transactions with pagination and filters
   */
  static async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    try {
      return await apiUtils.getPaginated<Transaction>('/api/transactions', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get a single transaction by ID
   */
  static async getTransactionById(id: string): Promise<Transaction> {
    try {
      return await api.get<Transaction>(`/api/transactions/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    try {
      return await api.post<Transaction>('/api/transactions', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    try {
      return await api.put<Transaction>(`/api/transactions/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update transaction');
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<void> {
    try {
      await api.delete(`/api/transactions/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete transaction');
    }
  }

  /**
   * Get transaction summary
   */
  static async getSummary(startDate?: string, endDate?: string): Promise<TransactionSummary> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = apiUtils.buildQueryString(params);
      const url = queryString ? `/api/transactions/summary?${queryString}` : '/api/transactions/summary';
      
      return await api.get<TransactionSummary>(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch transaction summary');
    }
  }
}
