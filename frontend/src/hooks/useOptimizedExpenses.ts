import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseService } from '../services/expenseService';
import type { ExpenseData, ExpenseFormData, ExpenseQuery, TrendData } from '../types/expense';
import { useAppDispatch } from './redux';
import { setError, clearError } from '../store/expenseSlice';

// Query keys for better cache management
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseQuery) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
  trends: () => [...expenseKeys.all, 'trends'] as const,
  trend: (filters: ExpenseQuery) => [...expenseKeys.trends(), filters] as const,
};

// Optimized hook for fetching expenses with caching
export const useExpensesQuery = (query?: ExpenseQuery) => {
  const dispatch = useAppDispatch();
  
  return useQuery({
    queryKey: expenseKeys.list(query || {}),
    queryFn: () => ExpenseService.getExpenses(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to fetch expenses';
      dispatch(setError(errorMessage));
    },
    onSuccess: () => {
      dispatch(clearError());
    }
  });
};

// Optimized hook for fetching trend data
export const useTrendsQuery = (query?: ExpenseQuery) => {
  const dispatch = useAppDispatch();
  
  return useQuery({
    queryKey: expenseKeys.trend(query || {}),
    queryFn: () => ExpenseService.getTrends(query),
    staleTime: 10 * 60 * 1000, // 10 minutes - trends change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to fetch trend data';
      dispatch(setError(errorMessage));
    },
    onSuccess: () => {
      dispatch(clearError());
    }
  });
};

// Optimized hook for fetching single expense
export const useExpenseQuery = (id: number) => {
  const dispatch = useAppDispatch();
  
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => ExpenseService.getExpenseById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to fetch expense';
      dispatch(setError(errorMessage));
    }
  });
};

// Optimized mutation hooks with cache updates
export const useCreateExpenseMutation = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: (data: ExpenseFormData) => ExpenseService.createExpense(data),
    onSuccess: (newExpense) => {
      // Invalidate and refetch expense lists
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.trends() });
      
      // Optimistically update cache if possible
      queryClient.setQueryData(expenseKeys.detail(newExpense.id), newExpense);
      
      dispatch(clearError());
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to create expense';
      dispatch(setError(errorMessage));
    }
  });
};

export const useUpdateExpenseMutation = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseFormData }) => 
      ExpenseService.updateExpense(id, data),
    onSuccess: (updatedExpense, { id }) => {
      // Update specific expense in cache
      queryClient.setQueryData(expenseKeys.detail(id), updatedExpense);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.trends() });
      
      dispatch(clearError());
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to update expense';
      dispatch(setError(errorMessage));
    }
  });
};

export const useDeleteExpenseMutation = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: (id: number) => ExpenseService.deleteExpense(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.trends() });
      
      dispatch(clearError());
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Failed to delete expense';
      dispatch(setError(errorMessage));
    }
  });
};

// Hook for prefetching data
export const usePrefetchExpenses = () => {
  const queryClient = useQueryClient();
  
  const prefetchExpenses = (query?: ExpenseQuery) => {
    queryClient.prefetchQuery({
      queryKey: expenseKeys.list(query || {}),
      queryFn: () => ExpenseService.getExpenses(query),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchTrends = (query?: ExpenseQuery) => {
    queryClient.prefetchQuery({
      queryKey: expenseKeys.trend(query || {}),
      queryFn: () => ExpenseService.getTrends(query),
      staleTime: 10 * 60 * 1000,
    });
  };
  
  return { prefetchExpenses, prefetchTrends };
};