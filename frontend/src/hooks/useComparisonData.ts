import { useState, useCallback, useEffect } from 'react';
import { ExpenseService } from '../services/expenseService';
import type { TrendData, ExpenseQuery } from '../types/expense';
import { MonthYear } from '../components/MultiMonthSelector';

export const useComparisonData = () => {
  const [comparisonData, setComparisonData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data for selected months
  const fetchComparisonData = useCallback(async (selectedMonths: MonthYear[]) => {
    if (selectedMonths.length === 0) {
      setComparisonData([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch trend data for each selected month
      const promises = selectedMonths.map(async (monthYear) => {
        const query: ExpenseQuery = {
          month: monthYear.month,
          year: monthYear.year
        };
        return ExpenseService.getTrends(query);
      });

      const results = await Promise.all(promises);
      
      // Flatten the results since each call returns an array
      const allTrendData = results.flat();
      
      // Remove duplicates based on month/year combination
      const uniqueTrendData = allTrendData.filter((trend, index, array) => 
        array.findIndex(t => t.month === trend.month && t.year === trend.year) === index
      );

      setComparisonData(uniqueTrendData);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch comparison data';
      setError(errorMessage);
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate summary statistics for comparison
  const calculateSummaryStats = useCallback((data: TrendData[], selectedMonths: MonthYear[]) => {
    if (data.length === 0 || selectedMonths.length === 0) {
      return {
        totalExpenses: 0,
        averageMonthly: 0,
        highestMonth: null as MonthYear | null,
        lowestMonth: null as MonthYear | null,
        totalCategories: 0
      };
    }

    const monthlyTotals = selectedMonths.map(monthYear => {
      const trendItem = data.find(t => t.month === monthYear.month && t.year === monthYear.year);
      return {
        monthYear,
        total: trendItem?.totalAmount || 0
      };
    });

    const totalExpenses = monthlyTotals.reduce((sum, item) => sum + item.total, 0);
    const averageMonthly = totalExpenses / selectedMonths.length;
    
    const sortedByAmount = [...monthlyTotals].sort((a, b) => b.total - a.total);
    const highestMonth = sortedByAmount[0]?.monthYear || null;
    const lowestMonth = sortedByAmount[sortedByAmount.length - 1]?.monthYear || null;

    // Count unique categories across all selected months
    const allCategories = new Set();
    data.forEach(trend => {
      trend.categories.forEach(cat => allCategories.add(cat.category));
    });

    return {
      totalExpenses,
      averageMonthly,
      highestMonth,
      lowestMonth,
      totalCategories: allCategories.size
    };
  }, []);

  // Get trend indicators for categories
  const getTrendIndicators = useCallback((data: TrendData[], selectedMonths: MonthYear[]) => {
    if (selectedMonths.length < 2) return [];

    const sortedMonths = [...selectedMonths].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];

    const firstTrend = data.find(t => t.month === firstMonth.month && t.year === firstMonth.year);
    const lastTrend = data.find(t => t.month === lastMonth.month && t.year === lastMonth.year);

    if (!firstTrend || !lastTrend) return [];

    // Get all categories
    const allCategories = new Set<string>();
    data.forEach(trend => {
      trend.categories.forEach(cat => allCategories.add(cat.category));
    });

    return Array.from(allCategories).map(category => {
      const firstAmount = firstTrend.categories.find(c => c.category === category)?.amount || 0;
      const lastAmount = lastTrend.categories.find(c => c.category === category)?.amount || 0;
      
      let percentageChange = 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (firstAmount > 0) {
        percentageChange = ((lastAmount - firstAmount) / firstAmount) * 100;
        trend = percentageChange > 5 ? 'increasing' : percentageChange < -5 ? 'decreasing' : 'stable';
      } else if (lastAmount > 0) {
        percentageChange = 100;
        trend = 'increasing';
      }

      return {
        category,
        firstAmount,
        lastAmount,
        percentageChange,
        trend,
        absoluteChange: lastAmount - firstAmount
      };
    });
  }, []);

  // Clear comparison data
  const clearComparisonData = useCallback(() => {
    setComparisonData([]);
    setError(null);
  }, []);

  return {
    comparisonData,
    loading,
    error,
    fetchComparisonData,
    calculateSummaryStats,
    getTrendIndicators,
    clearComparisonData
  };
};