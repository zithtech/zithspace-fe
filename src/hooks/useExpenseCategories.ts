import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import ExpenseCategoryService, { Category, CreateCategoryData, UpdateCategoryData } from '@/services/expenseCategoryService';

// Get all categories
export function useExpenseCategories() {
  const query = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      console.log('useExpenseCategories: Starting query...');
      try {
        const result = await ExpenseCategoryService.getCategories();
        console.log('useExpenseCategories: Query completed successfully:', result);
        return result;
      } catch (error: any) {
        console.error('useExpenseCategories: Query failed:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Allow one retry on failure
    retryDelay: 1000, // Wait 1 second before retry
  });

  // Handle errors separately
  if (query.error) {
    console.error('Error fetching categories:', query.error);
    message.error('Failed to load categories');
  }

  return query;
}

// Create category
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCategoryData) => ExpenseCategoryService.createCategory(data),
    onSuccess: () => {
      message.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (error: any) => {
      message.error(error?.message || 'Failed to create category');
    },
  });
}

// Update category
export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) => 
      ExpenseCategoryService.updateCategory(id, data),
    onSuccess: () => {
      message.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (error: any) => {
      message.error(error?.message || 'Failed to update category');
    },
  });
}

// Delete category
export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => ExpenseCategoryService.deleteCategory(id),
    onSuccess: () => {
      message.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (error: any) => {
      message.error(error?.message || 'Failed to delete category');
    },
  });
}
