import React, { useState, useCallback } from 'react';
import { ExpenseCategory } from '../types/expense';

export interface FilterCriteria {
  categories: ExpenseCategory[];
  dateRange: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  };
  amountRange: {
    min: number;
    max: number;
  };
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  loading?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const ALL_CATEGORIES = Object.values(ExpenseCategory);

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = useCallback((updates: Partial<FilterCriteria>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const handleCategoryToggle = useCallback((category: ExpenseCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    updateFilters({ categories: newCategories });
  }, [filters.categories, updateFilters]);

  const handleSelectAllCategories = useCallback(() => {
    updateFilters({ 
      categories: filters.categories.length === ALL_CATEGORIES.length ? [] : ALL_CATEGORIES 
    });
  }, [filters.categories.length, updateFilters]);

  const handleDateRangeChange = useCallback((field: keyof FilterCriteria['dateRange'], value: number) => {
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  }, [filters.dateRange, updateFilters]);

  const handleAmountRangeChange = useCallback((field: keyof FilterCriteria['amountRange'], value: number) => {
    updateFilters({
      amountRange: {
        ...filters.amountRange,
        [field]: value
      }
    });
  }, [filters.amountRange, updateFilters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    
    // Category filters
    if (filters.categories.length > 0 && filters.categories.length < ALL_CATEGORIES.length) {
      count++;
    }
    
    // Date range filters
    const hasDateFilter = filters.dateRange.startYear !== CURRENT_YEAR - 5 ||
                         filters.dateRange.startMonth !== 1 ||
                         filters.dateRange.endYear !== CURRENT_YEAR ||
                         filters.dateRange.endMonth !== 12;
    if (hasDateFilter) count++;
    
    // Amount range filters
    if (filters.amountRange.min > 0 || filters.amountRange.max < 1000000) {
      count++;
    }
    
    return count;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <svg
              className={`ml-1 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Category Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Categories</label>
              <button
                onClick={handleSelectAllCategories}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {filters.categories.length === ALL_CATEGORIES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((category) => (
                <label key={category} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 truncate" title={category}>
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Month</label>
                <select
                  value={filters.dateRange.startMonth}
                  onChange={(e) => handleDateRangeChange('startMonth', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Year</label>
                <select
                  value={filters.dateRange.startYear}
                  onChange={(e) => handleDateRangeChange('startYear', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {YEARS.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Month</label>
                <select
                  value={filters.dateRange.endMonth}
                  onChange={(e) => handleDateRangeChange('endMonth', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Year</label>
                <select
                  value={filters.dateRange.endYear}
                  onChange={(e) => handleDateRangeChange('endYear', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {YEARS.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Amount Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filters.amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filters.amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', parseFloat(e.target.value) || 1000000)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Sorting Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Sort Results</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as FilterCriteria['sortBy'] })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilters({ sortOrder: e.target.value as FilterCriteria['sortOrder'] })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
            <button
              onClick={onApplyFilters}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};