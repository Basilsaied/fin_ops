import React, { useState, useEffect } from 'react';
import { LazyBarChart, LazyLineChart } from '../components/charts/LazyCharts';
import { ChartContainer } from '../components/charts';
import { MonthYearSelector } from '../components/MonthYearSelector';
import { useChartData } from '../hooks/useChartData';
import { DashboardSkeleton, ProgressiveLoader } from '../components/LoadingSkeletons';
import { usePrefetchExpenses } from '../hooks/useOptimizedExpenses';

interface DashboardProps {
  selectedMonth?: number;
  selectedYear?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  selectedMonth: propSelectedMonth, 
  selectedYear: propSelectedYear 
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    propSelectedMonth || currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    propSelectedYear || currentDate.getFullYear()
  );

  const { categoryData, trendData, loading, error, fetchAllChartData } = useChartData();
  const { prefetchExpenses, prefetchTrends } = usePrefetchExpenses();

  // Calculate summary statistics
  const totalExpenses = categoryData.reduce((sum, item) => sum + item.amount, 0);
  const categoriesWithExpenses = categoryData.filter(item => item.amount > 0).length;
  
  // Calculate trend vs previous month
  const currentMonthTrend = trendData.find(
    item => item.month === selectedMonth && item.year === selectedYear
  );
  const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const previousMonthTrend = trendData.find(
    item => item.month === previousMonth && item.year === previousYear
  );
  
  const trendPercentage = currentMonthTrend && previousMonthTrend && previousMonthTrend.totalAmount > 0
    ? ((currentMonthTrend.totalAmount - previousMonthTrend.totalAmount) / previousMonthTrend.totalAmount) * 100
    : null;

  // Fetch data when month/year changes
  useEffect(() => {
    fetchAllChartData({ 
      month: selectedMonth, 
      year: selectedYear 
    });
  }, [selectedMonth, selectedYear, fetchAllChartData]);

  // Also fetch trend data for multiple months for line chart
  useEffect(() => {
    // Fetch last 6 months of trend data
    const endDate = new Date(selectedYear, selectedMonth - 1);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 5);
    
    fetchAllChartData({
      // For trend data, we don't filter by specific month to get multiple months
    });
  }, [selectedMonth, selectedYear, fetchAllChartData]);

  // Prefetch next/previous month data for better UX
  useEffect(() => {
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    
    // Prefetch adjacent months
    prefetchExpenses({ month: nextMonth, year: nextYear });
    prefetchExpenses({ month: prevMonth, year: prevYear });
    prefetchTrends({ month: nextMonth, year: nextYear });
    prefetchTrends({ month: prevMonth, year: prevYear });
  }, [selectedMonth, selectedYear, prefetchExpenses, prefetchTrends]);

  return (
    <ProgressiveLoader
      isLoading={loading}
      skeleton={<DashboardSkeleton />}
      delay={300}
    >
      <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h2>
            <p className="text-gray-600">
              Viewing data for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0">
            <MonthYearSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Total Expenses
            </h3>
            <p className="text-2xl font-bold text-blue-700">
              ${totalExpenses.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600 mt-1">Current month</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Categories
            </h3>
            <p className="text-2xl font-bold text-green-700">{categoriesWithExpenses}</p>
            <p className="text-sm text-green-600 mt-1">With expenses</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Trend
            </h3>
            <p className="text-2xl font-bold text-purple-700">
              {trendPercentage !== null 
                ? `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`
                : '--'
              }
            </p>
            <p className="text-sm text-purple-600 mt-1">vs last month</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartContainer
          loading={loading}
          error={error}
          title="Category Breakdown"
        >
          <LazyBarChart
            data={categoryData}
            title={`Expenses by Category - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}`}
            height={350}
            loading={loading}
          />
        </ChartContainer>
        
        <ChartContainer
          loading={loading}
          error={error}
          title="Trend Analysis"
        >
          <LazyLineChart
            data={trendData}
            title="Expense Trends Over Time"
            height={350}
            loading={loading}
          />
        </ChartContainer>
      </div>

      {/* Additional insights */}
      {categoryData.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Highest Expense Category</h4>
              <p className="text-gray-600">
                {categoryData.length > 0 
                  ? `${categoryData.reduce((max, item) => item.amount > max.amount ? item : max).category}: $${categoryData.reduce((max, item) => item.amount > max.amount ? item : max).amount.toLocaleString()}`
                  : 'No data available'
                }
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Average per Category</h4>
              <p className="text-gray-600">
                ${categoriesWithExpenses > 0 
                  ? (totalExpenses / categoriesWithExpenses).toLocaleString()
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProgressiveLoader>
  );
};

export default Dashboard;