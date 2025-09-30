import { useState, useCallback, useEffect } from 'react';
import { ExpenseService } from '../services/expenseService';
import type { ExpenseData, TrendData, CategoryAmount, ExpenseQuery } from '../types/expense';

export const useChartData = () => {
  const [categoryData, setCategoryData] = useState<CategoryAmount[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch category breakdown data for bar chart
  const fetchCategoryData = useCallback(async (query?: ExpenseQuery) => {
    setLoading(true);
    setError(null);
    try {
      const expenses = await ExpenseService.getExpenses(query);
      
      // Transform expenses into category amounts
      const categoryMap = new Map<string, number>();
      expenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      });

      const categoryAmounts: CategoryAmount[] = Array.from(categoryMap.entries()).map(
        ([category, amount]) => ({
          category: category as any,
          amount
        })
      );

      setCategoryData(categoryAmounts);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch category data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trend data for line chart
  const fetchTrendData = useCallback(async (query?: ExpenseQuery) => {
    setLoading(true);
    setError(null);
    try {
      const trends = await ExpenseService.getTrends(query);
      setTrendData(trends);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch trend data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch both category and trend data
  const fetchAllChartData = useCallback(async (query?: ExpenseQuery) => {
    setLoading(true);
    setError(null);
    try {
      const [expenses, trends] = await Promise.all([
        ExpenseService.getExpenses(query),
        ExpenseService.getTrends(query)
      ]);

      // Transform expenses into category amounts
      const categoryMap = new Map<string, number>();
      expenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      });

      const categoryAmounts: CategoryAmount[] = Array.from(categoryMap.entries()).map(
        ([category, amount]) => ({
          category: category as any,
          amount
        })
      );

      setCategoryData(categoryAmounts);
      setTrendData(trends);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch chart data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categoryData,
    trendData,
    loading,
    error,
    fetchCategoryData,
    fetchTrendData,
    fetchAllChartData
  };
};