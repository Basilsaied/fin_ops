import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { TrendData, ExpenseCategory } from '../../types/expense';

interface LineChartProps {
  data: TrendData[];
  title: string;
  height?: number;
  loading?: boolean;
  selectedCategories?: ExpenseCategory[];
}

// Color palette for different categories
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.SALARIES]: '#8884d8',
  [ExpenseCategory.SOFTWARE_TOOLS]: '#82ca9d',
  [ExpenseCategory.INFRASTRUCTURE_HOSTING]: '#ffc658',
  [ExpenseCategory.HARDWARE_EQUIPMENT]: '#ff7c7c',
  [ExpenseCategory.SECURITY_COMPLIANCE]: '#8dd1e1',
  [ExpenseCategory.OPERATIONAL_ADMINISTRATIVE]: '#d084d0',
  [ExpenseCategory.CONTINUOUS_LEARNING_RD]: '#ffb347'
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Transform trend data for chart display
const transformTrendData = (data: TrendData[], selectedCategories?: ExpenseCategory[]) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return data.map(item => {
    const monthLabel = `${monthNames[item.month - 1]} ${item.year}`;
    const chartItem: any = {
      monthLabel,
      month: item.month,
      year: item.year,
      totalAmount: item.totalAmount
    };

    // Add category amounts as separate properties
    item.categories.forEach(cat => {
      if (!selectedCategories || selectedCategories.includes(cat.category)) {
        chartItem[cat.category] = cat.amount;
      }
    });

    return chartItem;
  });
};

// Get all unique categories from the data
const getAllCategories = (data: TrendData[]): ExpenseCategory[] => {
  const categories = new Set<ExpenseCategory>();
  data.forEach(item => {
    item.categories.forEach(cat => {
      categories.add(cat.category);
    });
  });
  return Array.from(categories);
};

const LineChartComponent: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  height = 400,
  loading = false,
  selectedCategories
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

  if (!data || data.length === 0) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  const chartData = transformTrendData(data, selectedCategories);
  const categories = selectedCategories || getAllCategories(data);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthLabel"
            tick={{ fontSize: 12, fill: '#666' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Total amount line */}
          <Line
            type="monotone"
            dataKey="totalAmount"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            name="Total Amount"
          />
          
          {/* Category lines */}
          {categories.map((category) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={CATEGORY_COLORS[category]}
              strokeWidth={2}
              dot={{ fill: CATEGORY_COLORS[category], strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: CATEGORY_COLORS[category], strokeWidth: 1 }}
              name={category}
              connectNulls={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const LineChart = React.memo(LineChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.title === nextProps.title &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.selectedCategories) === JSON.stringify(nextProps.selectedCategories)
  );
});