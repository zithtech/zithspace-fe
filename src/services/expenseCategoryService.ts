import { api } from '@/lib/axios';

// Interfaces
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color: string;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
}

export class ExpenseCategoryService {
  // Get all categories
  static async getCategories(): Promise<Category[]> {
    console.log('ExpenseCategoryService: Fetching categories...');
    try {
      const categories = await api.get<Category[]>('/api/categories');
      console.log('ExpenseCategoryService: API response received:', categories);
      console.log('ExpenseCategoryService: Categories extracted:', categories);
      return categories;
    } catch (error) {
      console.error('ExpenseCategoryService: Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID
  static async getCategoryById(id: string): Promise<Category> {
    return await api.get<Category>(`/api/categories/${id}`);
  }

  // Create new category
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    return await api.post<Category>('/api/categories', data);
  }

  // Update category
  static async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    return await api.put<Category>(`/api/categories/${id}`, data);
  }

  // Delete category
  static async deleteCategory(id: string): Promise<void> {
    await api.delete<void>(`/api/categories/${id}`);
  }

  // Get category statistics
  static async getCategoryStats(): Promise<CategoryStats> {
    return await api.get<CategoryStats>('/api/categories/stats');
  }
}

export default ExpenseCategoryService;
