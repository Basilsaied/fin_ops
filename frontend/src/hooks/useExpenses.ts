import { useState, useCallback } from 'react';
import { ExpenseService } from '../services/expenseService';
import type { ExpenseData, ExpenseFormData, ExpenseQuery } from '../types/expense';
import { useAppDispatch } from './redux';
import { setError, clearError } from '../store/expenseSlice';

// Simple hook for expense management
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<string>('');
  const dispatch = useAppDispatch();

  const fetchExpenses = useCallback(async (query?: ExpenseQuery) => {
    setLoading(true);
    setErrorState('');
    try {
      const data = await ExpenseService.getExpenses(query);
      setExpenses(data);
      dispatch(clearError());
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error?.message || 
                          err?.message || 
                          'Failed to fetch expenses';
      setErrorState(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const createExpense = useCallback(async (data: ExpenseFormData) => {
    const expense = await ExpenseService.createExpense(data);
    dispatch(clearError());
    return expense;
  }, [dispatch]);

  const updateExpense = useCallback(async (id: number, data: ExpenseFormData) => {
    const expense = await ExpenseService.updateExpense(id, data);
    dispatch(clearError());
    return expense;
  }, [dispatch]);

  const deleteExpense = useCallback(async (id: number) => {
    await ExpenseService.deleteExpense(id);
    dispatch(clearError());
  }, [dispatch]);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  };
};