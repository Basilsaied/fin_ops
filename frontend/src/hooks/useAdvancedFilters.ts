import { useState, useCallback, useMemo } from 'react';
import { ExpenseService } from '../services/expenseService';
import type { ExpenseData, ExpenseQuery, ExpenseCategory } from '../types/expense';
import { FilterCriteria } from '../components/AdvancedFilters';

const CURRENT_YEAR = new Date().getFullYear();

// Default filter criteria
const DEFAULT_FILTERS: FilterCriteria = {
  categories: [],
  dateRange: {
    startMonth: 1,
    startYear: CURRENT_YEAR - 2,
    endMonth: 12,
    endYear: CURRENT_YEAR
  },
  amountRange: {
    min: 0,
    max: 1000000
  },
  sortBy: 'date',
  sortOrder: 'desc'
};

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert filters to API query parameters
  const filtersToQuery = useCallback((filterCriteria: FilterCriteria): ExpenseQuery => {
    const query: ExpenseQuery = {};

    // Note: For date range filtering, we'll need to fetch all data and filter client-side
    // since the API doesn't support date range queries directly
    
    return query;
  }, []);

  // Apply client-side filtering to expenses
  const applyClientSideFilters = useCallback((expenses: ExpenseData[], filterCriteria: FilterCriteria): ExpenseData[] => {
    let filtered = [...expenses];

    // Filter by categories
    if (filterCriteria.categories.length > 0) {
      filtered = filtered.filter(expense => 
        filterCriteria.categories.includes(expense.category)
      );
    }

    // Filter by date range
    filtered = filtered.filter(expense => {
      const expenseDate = new Date(expense.year, expense.month - 1);
      const startDate = new Date(filterCriteria.dateRange.startYear, filterCriteria.dateRange.startMonth - 1);
      const endDate = new Date(filterCriteria.dateRange.endYear, filterCriteria.dateRange.endMonth);
      
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Filter by amount range
    filtered = filtered.filter(expense => 
      expense.amount >= filterCriteria.amountRange.min && 
      expense.amount <= filterCriteria.amountRange.max
    );

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filterCriteria.sortBy) {
        case 'date':
          const dateA = new Date(a.year, a.month - 1);
          const dateB = new Date(b.year, b.month - 1);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return filterCriteria.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, []);

  // Fetch and filter expenses
  const fetchFilteredExpenses = useCallback(async (filterCriteria: FilterCriteria) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all expenses (we could optimize this by adding date range support to the API)
      const allExpenses = await ExpenseService.getExpenses();
      
      // Apply client-side filtering
      const filtered = applyClientSideFilters(allExpenses, filterCriteria);
      
      setFilteredExpenses(filtered);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch filtered expenses';
      setError(errorMessage);
      setFilteredExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [applyClientSideFilters]);

  // Update filters
  const updateFilters = useCallback((newFilters: FilterCriteria) => {
    setFilters(newFilters);
  }, []);

  // Apply current filters
  const applyFilters = useCallback(() => {
    fetchFilteredExpenses(filters);
  }, [filters, fetchFilteredExpenses]);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setFilteredExpenses([]);
    setError(null);
  }, []);

  // Get filter summary for display
  const getFilterSummary = useCallback((filterCriteria: FilterCriteria) => {
    const summary: string[] = [];
    
    if (filterCriteria.categories.length > 0) {
      summary.push(`${filterCriteria.categories.length} categories selected`);
    }
    
    const isDefaultDateRange = 
      filterCriteria.dateRange.startYear === CURRENT_YEAR - 2 &&
      filterCriteria.dateRange.startMonth === 1 &&
      filterCriteria.dateRange.endYear === CURRENT_YEAR &&
      filterCriteria.dateRange.endMonth === 12;
    
    if (!isDefaultDateRange) {
      summary.push('Custom date range');
    }
    
    if (filterCriteria.amountRange.min > 0 || filterCriteria.amountRange.max < 1000000) {
      summary.push('Amount range filter');
    }
    
    return summary;
  }, []);

  // Check if filters are active (different from default)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.dateRange.startYear !== DEFAULT_FILTERS.dateRange.startYear ||
      filters.dateRange.startMonth !== DEFAULT_FILTERS.dateRange.startMonth ||
      filters.dateRange.endYear !== DEFAULT_FILTERS.dateRange.endYear ||
      filters.dateRange.endMonth !== DEFAULT_FILTERS.dateRange.endMonth ||
      filters.amountRange.min !== DEFAULT_FILTERS.amountRange.min ||
      filters.amountRange.max !== DEFAULT_FILTERS.amountRange.max ||
      filters.sortBy !== DEFAULT_FILTERS.sortBy ||
      filters.sortOrder !== DEFAULT_FILTERS.sortOrder
    );
  }, [filters]);

  // Get unique categories from filtered results
  const getAvailableCategories = useCallback((): ExpenseCategory[] => {
    const categories = new Set<ExpenseCategory>();
    filteredExpenses.forEach(expense => {
      categories.add(expense.category);
    });
    return Array.from(categories);
  }, [filteredExpenses]);

  // Get date range from filtered results
  const getDateRange = useCallback() => {
    if (filteredExpenses.length === 0) {
      return { startDate: null, endDate: null };
    }
    
    const dates = filteredExpenses.map(expense => new Date(expense.year, expense.month - 1));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return { startDate, endDate };
  }, [filteredExpenses]);

  return {
    filters,
    filteredExpenses,
    loading,
    error,
    hasActiveFilters,
    updateFilters,
    applyFilters,
    resetFilters,
    getFilterSummary,
    getAvailableCategories,
    getDateRange,
    fetchFilteredExpenses
  };
};