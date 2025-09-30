import React from 'react';
import type { ExpenseData, TrendData } from '../types/expense';
import { FilterCriteria } from './AdvancedFilters';

interface PrintableReportProps {
  expenses: ExpenseData[];
  trendData?: TrendData[];
  filters: FilterCriteria;
  title?: string;
  generatedAt?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PrintableReport: React.FC<PrintableReportProps> = ({
  expenses,
  trendData = [],
  filters,
  title = 'Expense Report',
  generatedAt = new Date()
}) => {
  // Calculate summary statistics
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
  
  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Group expenses by month
  const monthlyTotals = expenses.reduce((acc, expense) => {
    const key = `${expense.year}-${expense.month.toString().padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const formatDateRange = () => {
    const startMonth = MONTH_NAMES[filters.dateRange.startMonth - 1];
    const endMonth = MONTH_NAMES[filters.dateRange.endMonth - 1];
    return `${startMonth} ${filters.dateRange.startYear} - ${endMonth} ${filters.dateRange.endYear}`;
  };

  return (
    <div className="print:block hidden">
      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>Generated on: {generatedAt.toLocaleDateString()} at {generatedAt.toLocaleTimeString()}</p>
              <p>Date Range: {formatDateRange()}</p>
            </div>
            <div className="text-right">
              <p>Total Expenses: {expenses.length}</p>
              <p>Total Amount: ${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Applied Filters */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Applied Filters</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Categories:</strong> {
                  filters.categories.length === 0 
                    ? 'All categories' 
                    : filters.categories.length > 3 
                    ? `${filters.categories.slice(0, 3).join(', ')} and ${filters.categories.length - 3} more`
                    : filters.categories.join(', ')
                }
              </div>
              <div>
                <strong>Date Range:</strong> {formatDateRange()}
              </div>
              <div>
                <strong>Amount Range:</strong> ${filters.amountRange.min.toLocaleString()} - ${filters.amountRange.max.toLocaleString()}
              </div>
              <div>
                <strong>Sort:</strong> {filters.sortBy} ({filters.sortOrder})
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Summary Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="text-2xl font-bold text-blue-600">{expenses.length}</div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="text-2xl font-bold text-purple-600">${averageAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Average Amount</div>
            </div>
            <div className="text-center p-3 border border-gray-200 rounded">
              <div className="text-2xl font-bold text-orange-600">{Object.keys(categoryTotals).length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Category Breakdown</h2>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => {
                    const count = expenses.filter(e => e.category === category).length;
                    const percentage = (amount / totalAmount) * 100;
                    return (
                      <tr key={category}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {Object.keys(monthlyTotals).length > 1 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Monthly Breakdown</h2>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expenses
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(monthlyTotals)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([monthKey, amount]) => {
                      const [year, month] = monthKey.split('-');
                      const monthName = MONTH_NAMES[parseInt(month) - 1];
                      const count = expenses.filter(e => 
                        e.year === parseInt(year) && e.month === parseInt(month)
                      ).length;
                      const percentage = (amount / totalAmount) * 100;
                      return (
                        <tr key={monthKey}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {monthName} {year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {count}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Expense List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Detailed Expense List</h2>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.slice(0, 50).map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {MONTH_NAMES[expense.month - 1]} {expense.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${expense.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length > 50 && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                Showing first 50 of {expenses.length} expenses
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-500">
          <p>This report was generated automatically by the Expense Management System</p>
        </div>
      </div>
    </div>
  );
};