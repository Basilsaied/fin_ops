import React from 'react';
import type { ExpenseData, ExpenseCategory } from '../types/expense';

interface SummaryStatisticsProps {
  expenses: ExpenseData[];
  loading?: boolean;
  title?: string;
}

interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  average: number;
  percentage: number;
}

interface StatsSummary {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  monthsSpanned: number;
  categorySummaries: CategorySummary[];
  highestCategory: CategorySummary | null;
  lowestCategory: CategorySummary | null;
  mostFrequentCategory: CategorySummary | null;
}

const calculateStatistics = (expenses: ExpenseData[]): StatsSummary => {
  if (expenses.length === 0) {
    return {
      totalExpenses: 0,
      totalAmount: 0,
      averageAmount: 0,
      monthsSpanned: 0,
      categorySummaries: [],
      highestCategory: null,
      lowestCategory: null,
      mostFrequentCategory: null
    };
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpenses = expenses.length;
  const averageAmount = totalAmount / totalExpenses;

  // Calculate months spanned
  const uniqueMonths = new Set(
    expenses.map(expense => `${expense.year}-${expense.month.toString().padStart(2, '0')}`)
  );
  const monthsSpanned = uniqueMonths.size;

  // Calculate category summaries
  const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
  
  expenses.forEach(expense => {
    const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
    categoryMap.set(expense.category, {
      total: existing.total + expense.amount,
      count: existing.count + 1
    });
  });

  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      average: data.total / data.count,
      percentage: (data.total / totalAmount) * 100
    })
  );

  // Sort by total amount for finding highest/lowest
  const sortedByAmount = [...categorySummaries].sort((a, b) => b.total - a.total);
  const highestCategory = sortedByAmount[0] || null;
  const lowestCategory = sortedByAmount[sortedByAmount.length - 1] || null;

  // Find most frequent category
  const sortedByCount = [...categorySummaries].sort((a, b) => b.count - a.count);
  const mostFrequentCategory = sortedByCount[0] || null;

  return {
    totalExpenses,
    totalAmount,
    averageAmount,
    monthsSpanned,
    categorySummaries: categorySummaries.sort((a, b) => b.total - a.total),
    highestCategory,
    lowestCategory,
    mostFrequentCategory
  };
};

export const SummaryStatistics: React.FC<SummaryStatisticsProps> = ({
  expenses,
  loading = false,
  title = 'Summary Statistics'
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = calculateStatistics(expenses);

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No expense data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-600">Total Expenses</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalExpenses}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-600">Total Amount</div>
          <div className="text-2xl font-bold text-green-900">
            ${stats.totalAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-600">Average Amount</div>
          <div className="text-2xl font-bold text-purple-900">
            ${stats.averageAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-600">Months Spanned</div>
          <div className="text-2xl font-bold text-orange-900">{stats.monthsSpanned}</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Category Breakdown</h4>
        <div className="space-y-3">
          {stats.categorySummaries.map((category) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 truncate" title={category.category}>
                  {category.category}
                </div>
                <div className="text-xs text-gray-600">
                  {category.count} expense{category.count !== 1 ? 's' : ''} • 
                  Avg: ${category.average.toLocaleString()}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm font-bold text-gray-900">
                  ${category.total.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="ml-3 w-16">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.highestCategory && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm font-medium text-red-600 mb-1">Highest Spending</div>
            <div className="text-sm font-bold text-red-900" title={stats.highestCategory.category}>
              {stats.highestCategory.category}
            </div>
            <div className="text-xs text-red-700">
              ${stats.highestCategory.total.toLocaleString()} ({stats.highestCategory.percentage.toFixed(1)}%)
            </div>
          </div>
        )}
        
        {stats.mostFrequentCategory && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm font-medium text-yellow-600 mb-1">Most Frequent</div>
            <div className="text-sm font-bold text-yellow-900" title={stats.mostFrequentCategory.category}>
              {stats.mostFrequentCategory.category}
            </div>
            <div className="text-xs text-yellow-700">
              {stats.mostFrequentCategory.count} expense{stats.mostFrequentCategory.count !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        
        {stats.lowestCategory && stats.categorySummaries.length > 1 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-600 mb-1">Lowest Spending</div>
            <div className="text-sm font-bold text-green-900" title={stats.lowestCategory.category}>
              {stats.lowestCategory.category}
            </div>
            <div className="text-xs text-green-700">
              ${stats.lowestCategory.total.toLocaleString()} ({stats.lowestCategory.percentage.toFixed(1)}%)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};