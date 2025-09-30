import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import type { TrendData, ExpenseCategory } from '../../types/expense';
import { MonthYear } from '../MultiMonthSelector';

interface ComparisonChartProps {
  data: TrendData[];
  selectedMonths: MonthYear[];
  title?: string;
  height?: number;
  loading?: boolean;
  showPercentageChange?: boolean;
}

interface ComparisonDataPoint {
  category: string;
  [key: string]: string | number; // Dynamic month columns
}

interface PercentageChange {
  category: ExpenseCategory;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// Color palette for different months
const MONTH_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
  '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.dataKey}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Transform trend data for comparison chart
const transformComparisonData = (data: TrendData[], selectedMonths: MonthYear[]): ComparisonDataPoint[] => {
  // Get all unique categories
  const allCategories = new Set<ExpenseCategory>();
  data.forEach(trend => {
    trend.categories.forEach(cat => allCategories.add(cat.category));
  });

  // Create comparison data structure
  const comparisonData: ComparisonDataPoint[] = Array.from(allCategories).map(category => {
    const dataPoint: ComparisonDataPoint = { category };
    
    selectedMonths.forEach(monthYear => {
      const trendItem = data.find(
        t => t.month === monthYear.month && t.year === monthYear.year
      );
      
      const categoryAmount = trendItem?.categories.find(
        c => c.category === category
      )?.amount || 0;
      
      dataPoint[monthYear.label] = categoryAmount;
    });
    
    return dataPoint;
  });

  return comparisonData;
};

// Calculate percentage changes between consecutive months
const calculatePercentageChanges = (data: TrendData[], selectedMonths: MonthYear[]): PercentageChange[] => {
  if (selectedMonths.length < 2) return [];

  const changes: PercentageChange[] = [];
  const sortedMonths = [...selectedMonths].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Get all categories
  const allCategories = new Set<ExpenseCategory>();
  data.forEach(trend => {
    trend.categories.forEach(cat => allCategories.add(cat.category));
  });

  Array.from(allCategories).forEach(category => {
    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    
    const firstTrend = data.find(t => t.month === firstMonth.month && t.year === firstMonth.year);
    const lastTrend = data.find(t => t.month === lastMonth.month && t.year === lastMonth.year);
    
    const firstAmount = firstTrend?.categories.find(c => c.category === category)?.amount || 0;
    const lastAmount = lastTrend?.categories.find(c => c.category === category)?.amount || 0;
    
    let change = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (firstAmount > 0) {
      change = ((lastAmount - firstAmount) / firstAmount) * 100;
      trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
    } else if (lastAmount > 0) {
      change = 100; // New expense category
      trend = 'up';
    }
    
    changes.push({ category, change, trend });
  });

  return changes;
};

const ComparisonChartComponent: React.FC<ComparisonChartProps> = ({
  data,
  selectedMonths,
  title = 'Multi-Month Comparison',
  height = 400,
  loading = false,
  showPercentageChange = true
}) => {
  if (loading) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || selectedMonths.length === 0) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          {selectedMonths.length === 0 
            ? 'Select months to compare' 
            : 'No data available for selected months'
          }
        </div>
      </div>
    );
  }

  const chartData = transformComparisonData(data, selectedMonths);
  const percentageChanges = showPercentageChange ? calculatePercentageChanges(data, selectedMonths) : [];

  return (
    <div className="w-full space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="category"
            tick={{ fontSize: 11, fill: '#666' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {selectedMonths.map((monthYear, index) => (
            <Bar
              key={`${monthYear.year}-${monthYear.month}`}
              dataKey={monthYear.label}
              fill={MONTH_COLORS[index % MONTH_COLORS.length]}
              name={monthYear.label}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>

      {showPercentageChange && percentageChanges.length > 0 && selectedMonths.length >= 2 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            Percentage Changes ({selectedMonths[0].label} → {selectedMonths[selectedMonths.length - 1].label})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {percentageChanges.map(({ category, change, trend }) => (
              <div
                key={category}
                className={`p-3 rounded-lg border ${
                  trend === 'up' 
                    ? 'bg-red-50 border-red-200' 
                    : trend === 'down' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-800 truncate" title={category}>
                  {category}
                </div>
                <div className={`text-lg font-bold ${
                  trend === 'up' 
                    ? 'text-red-600' 
                    : trend === 'down' 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                }`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  <span className="ml-1 text-sm">
                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ComparisonChart = React.memo(ComparisonChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.title === nextProps.title &&
    prevProps.height === nextProps.height &&
    prevProps.showPercentageChange === nextProps.showPercentageChange &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.selectedMonths) === JSON.stringify(nextProps.selectedMonths)
  );
});