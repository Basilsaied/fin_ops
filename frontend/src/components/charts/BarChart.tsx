import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CategoryAmount } from '../../types/expense';

interface BarChartProps {
  data: CategoryAmount[];
  title: string;
  height?: number;
  loading?: boolean;
}

// Color palette for different categories
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
  '#8dd1e1', '#d084d0', '#ffb347'
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-blue-600">
          Amount: ${data.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Format category names for display
const formatCategoryName = (category: string): string => {
  // Split long category names for better display
  if (category.length > 15) {
    const words = category.split(' ');
    if (words.length > 2) {
      const midpoint = Math.ceil(words.length / 2);
      return words.slice(0, midpoint).join(' ') + '\n' + words.slice(midpoint).join(' ');
    }
  }
  return category;
};

const BarChartComponent: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  height = 400,
  loading = false 
}) => {
  // Transform data for display
  const chartData = data.map((item, index) => ({
    ...item,
    displayCategory: formatCategoryName(item.category),
    color: COLORS[index % COLORS.length]
  }));

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
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
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
            dataKey="displayCategory"
            tick={{ fontSize: 12, fill: '#666' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            radius={[4, 4, 0, 0]}
            stroke="#fff"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const BarChart = React.memo(BarChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.title === nextProps.title &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});