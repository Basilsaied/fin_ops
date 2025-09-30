import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.get<T>(endpoint);
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  useEffect(() => {
    if (options.immediate) {
      fetchData();
    }
  }, [endpoint, options.immediate]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useApiMutation<TData, TVariables = any>() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const mutate = async (
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    variables?: TVariables
  ): Promise<TData | null> => {
    setState({ loading: true, error: null });
    
    try {
      let response: TData;
      
      switch (method) {
        case 'POST':
          response = await apiClient.post<TData>(endpoint, variables);
          break;
        case 'PUT':
          response = await apiClient.put<TData>(endpoint, variables);
          break;
        case 'DELETE':
          response = await apiClient.delete<TData>(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      setState({ loading: false, error: null });
      return response;
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      return null;
    }
  };

  return {
    ...state,
    mutate,
  };
}