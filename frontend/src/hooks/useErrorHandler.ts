import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setError, clearError } from '../store/expenseSlice';
import { ApiError } from '../types/expense';

interface UseErrorHandler {
  handleError: (error: Error | ApiError) => void;
  clearError: () => void;
  error: string | null;
}

export const useErrorHandler = (): UseErrorHandler => {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.expenses.error);

  const handleError = useCallback((error: Error | ApiError) => {
    let errorMessage = 'An unexpected error occurred';

    if ('code' in error) {
      // It's an ApiError
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    dispatch(setError(errorMessage));
  }, [dispatch]);

  const clearErrorHandler = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    handleError,
    clearError: clearErrorHandler,
    error,
  };
};